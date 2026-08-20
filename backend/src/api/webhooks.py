"""RevenueCat Webhook API Endpoints for Subscription Synchronization."""

from datetime import datetime, timezone
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from src.core.config import get_settings
from src.models.schemas import EntitlementTier
from src.services.entitlements import EntitlementService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks & Monetization"])


class RevenueCatEventPayload(BaseModel):
    api_version: str | None = None
    event: dict[str, Any] = Field(default_factory=dict)


@router.post("/revenuecat", status_code=status.HTTP_200_OK)
async def revenuecat_webhook_handler(
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    """Processes inbound RevenueCat webhook events and synchronizes user entitlements in Supabase."""
    settings = get_settings()

    # Validate auth token if configured
    if settings.REVENUECAT_WEBHOOK_AUTH_TOKEN:
        expected_token = settings.REVENUECAT_WEBHOOK_AUTH_TOKEN
        auth_header = authorization or request.headers.get("authorization", "")
        # Remove 'Bearer ' prefix if present
        token = auth_header.replace("Bearer ", "").strip() if auth_header else ""
        if token != expected_token:
            logger.warning("Unauthorized RevenueCat webhook attempt with invalid token.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing webhook authorization token.",
            )

    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse JSON body for RevenueCat webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON body.",
        )

    event = body.get("event", {})
    if not event:
        # Check if root is event payload
        event = body

    event_type = event.get("type", "UNKNOWN")
    app_user_id = event.get("app_user_id") or event.get("original_app_user_id")
    product_id = event.get("product_id")
    entitlement_ids = event.get("entitlement_ids") or []
    entitlement_id = entitlement_ids[0] if entitlement_ids else None
    expiration_at_ms = event.get("expiration_at_ms")

    logger.info(
        f"Received RevenueCat Webhook Event: type='{event_type}', "
        f"user='{app_user_id}', product='{product_id}', entitlements={entitlement_ids}"
    )

    if not app_user_id:
        return {
            "status": "ignored",
            "message": "Event has no associated app_user_id",
            "event_type": event_type,
        }

    # Handle TEST event
    if event_type == "TEST":
        return {
            "status": "processed",
            "message": "Test webhook event acknowledged successfully.",
            "event_type": event_type,
            "user_id": app_user_id,
        }

    expires_at = None
    if expiration_at_ms:
        expires_at = datetime.fromtimestamp(expiration_at_ms / 1000.0, tz=timezone.utc)

    # Determine resulting entitlement tier
    if event_type in ("INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE", "PRODUCT_CHANGE", "UNCANCELLATION"):
        tier = EntitlementService.get_tier_from_product_id(product_id, entitlement_id)
        await EntitlementService.update_user_subscription(
            user_id=app_user_id,
            tier=tier,
            revenuecat_customer_id=event.get("original_app_user_id") or app_user_id,
            entitlement_expires_at=expires_at,
        )
    elif event_type in ("EXPIRATION",):
        # Subscription has expired -> downgrade to Free
        await EntitlementService.update_user_subscription(
            user_id=app_user_id,
            tier=EntitlementTier.FREE,
            revenuecat_customer_id=event.get("original_app_user_id") or app_user_id,
            entitlement_expires_at=expires_at,
        )
    elif event_type in ("CANCELLATION", "BILLING_ISSUE"):
        # User canceled auto-renew or has billing issue, but might still have access until expiration
        tier = EntitlementService.get_tier_from_product_id(product_id, entitlement_id)
        if expires_at and expires_at < datetime.now(timezone.utc):
            tier = EntitlementTier.FREE

        await EntitlementService.update_user_subscription(
            user_id=app_user_id,
            tier=tier,
            revenuecat_customer_id=event.get("original_app_user_id") or app_user_id,
            entitlement_expires_at=expires_at,
        )

    return {
        "status": "processed",
        "event_type": event_type,
        "user_id": app_user_id,
        "product_id": product_id,
    }

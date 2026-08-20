"""User Entitlements & Quota Management Service for PaperPod."""

from datetime import datetime, timedelta, timezone
import logging
from typing import Any

from src.core.supabase_client import get_supabase
from src.models.schemas import EntitlementTier, UserEntitlementSchema

logger = logging.getLogger(__name__)

# Quota limits by tier
FREE_WEEKLY_CONVERSIONS_LIMIT = 2
FREE_VOICE_INTERRUPTIONS_PER_PAPER = 1


class EntitlementService:
    """Manages user subscription tiers, quota verification, and limits."""

    @staticmethod
    def get_tier_from_product_id(product_id: str | None, entitlement_id: str | None = None) -> EntitlementTier:
        """Maps RevenueCat product_id or entitlement_id to EntitlementTier enum."""
        if not product_id and not entitlement_id:
            return EntitlementTier.FREE

        p_id = (product_id or "").lower()
        e_id = (entitlement_id or "").lower()

        if "student" in p_id or "student" in e_id:
            return EntitlementTier.STUDENT_LIFETIME
        if "annual" in p_id or "yearly" in p_id:
            return EntitlementTier.PRO_ANNUAL
        if "monthly" in p_id or "pro" in p_id or "pro_access" in e_id:
            return EntitlementTier.PRO_MONTHLY

        return EntitlementTier.PRO_MONTHLY

    @staticmethod
    def compute_entitlements(
        user_id: str,
        tier: EntitlementTier = EntitlementTier.FREE,
        revenuecat_customer_id: str | None = None,
        weekly_conversions_used: int = 0,
        weekly_reset_at: datetime | None = None,
        is_student_verified: bool = False,
        entitlement_expires_at: datetime | None = None,
    ) -> UserEntitlementSchema:
        """Calculates derived entitlement capabilities based on subscription state and quotas."""
        now = datetime.now(timezone.utc)

        # Check for expiration
        if entitlement_expires_at and entitlement_expires_at < now and tier != EntitlementTier.STUDENT_LIFETIME:
            tier = EntitlementTier.FREE

        # Reset weekly quota if reset date has passed
        if weekly_reset_at and weekly_reset_at < now:
            weekly_conversions_used = 0
            weekly_reset_at = now + timedelta(days=7)
        elif not weekly_reset_at:
            weekly_reset_at = now + timedelta(days=7)

        is_pro = tier in (
            EntitlementTier.PRO_MONTHLY,
            EntitlementTier.PRO_ANNUAL,
            EntitlementTier.STUDENT_LIFETIME,
        )

        weekly_limit = 9999 if is_pro else FREE_WEEKLY_CONVERSIONS_LIMIT
        can_convert = is_pro or (weekly_conversions_used < FREE_WEEKLY_CONVERSIONS_LIMIT)

        return UserEntitlementSchema(
            user_id=user_id,
            tier=tier,
            revenuecat_customer_id=revenuecat_customer_id,
            weekly_conversions_used=weekly_conversions_used,
            weekly_conversions_limit=weekly_limit,
            weekly_reset_at=weekly_reset_at,
            is_student_verified=is_student_verified,
            entitlement_expires_at=entitlement_expires_at,
            can_convert_paper=can_convert,
            can_interrupt_voice=True,  # Pro has unlimited; Free has 1 per paper (tracked per-paper)
            can_access_deep_dives=is_pro,
        )

    @classmethod
    async def get_user_entitlements(cls, user_id: str) -> UserEntitlementSchema:
        """Retrieves and computes live entitlements for a given user from Supabase."""
        supabase = get_supabase()
        try:
            res = (
                supabase.table("user_entitlements")
                .select("*")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )

            if res and res.data:
                data = res.data
                tier_val = data.get("tier", "free")
                try:
                    tier = EntitlementTier(tier_val)
                except ValueError:
                    tier = EntitlementTier.FREE

                weekly_reset_at = (
                    datetime.fromisoformat(data["weekly_reset_at"].replace("Z", "+00:00"))
                    if data.get("weekly_reset_at")
                    else None
                )
                expires_at = (
                    datetime.fromisoformat(data["entitlement_expires_at"].replace("Z", "+00:00"))
                    if data.get("entitlement_expires_at")
                    else None
                )

                return cls.compute_entitlements(
                    user_id=user_id,
                    tier=tier,
                    revenuecat_customer_id=data.get("revenuecat_customer_id"),
                    weekly_conversions_used=data.get("weekly_conversions_used", 0),
                    weekly_reset_at=weekly_reset_at,
                    is_student_verified=data.get("is_student_verified", False),
                    entitlement_expires_at=expires_at,
                )
        except Exception as e:
            logger.warning(f"Failed to fetch user_entitlements from database for {user_id}: {e}")

        # Default fallback for new/unregistered users
        return cls.compute_entitlements(user_id=user_id, tier=EntitlementTier.FREE)

    @classmethod
    async def update_user_subscription(
        cls,
        user_id: str,
        tier: EntitlementTier,
        revenuecat_customer_id: str | None = None,
        entitlement_expires_at: datetime | None = None,
        is_student_verified: bool | None = None,
    ) -> dict[str, Any]:
        """Updates subscription tier in Supabase user_entitlements."""
        supabase = get_supabase()
        payload: dict[str, Any] = {
            "user_id": user_id,
            "tier": tier.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if revenuecat_customer_id:
            payload["revenuecat_customer_id"] = revenuecat_customer_id
        if entitlement_expires_at is not None:
            payload["entitlement_expires_at"] = entitlement_expires_at.isoformat()
        elif tier == EntitlementTier.STUDENT_LIFETIME:
            payload["entitlement_expires_at"] = None
        if is_student_verified is not None:
            payload["is_student_verified"] = is_student_verified

        try:
            res = (
                supabase.table("user_entitlements")
                .upsert(payload, on_conflict="user_id")
                .execute()
            )
            return {"status": "success", "data": res.data if res else None}
        except Exception as e:
            logger.error(f"Error upserting user subscription for {user_id}: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    async def increment_conversion_count(cls, user_id: str) -> bool:
        """Increments the weekly conversion counter for a user."""
        supabase = get_supabase()
        try:
            entitlement = await cls.get_user_entitlements(user_id)
            if not entitlement.can_convert_paper:
                return False

            new_count = entitlement.weekly_conversions_used + 1
            supabase.table("user_entitlements").upsert(
                {
                    "user_id": user_id,
                    "weekly_conversions_used": new_count,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="user_id",
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Error incrementing conversion count for {user_id}: {e}")
            return True  # Don't block user on DB error

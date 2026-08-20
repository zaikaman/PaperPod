"""Unit tests for RevenueCat webhook handler and entitlement synchronization (T049)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from httpx import ASGITransport, AsyncClient
import pytest

from src.core.config import get_settings
from src.main import app
from src.models.schemas import EntitlementTier

AUTH_HEADER = {"Authorization": f"Bearer {get_settings().REVENUECAT_WEBHOOK_AUTH_TOKEN}"}


@pytest.mark.asyncio
async def test_revenuecat_webhook_auth_failure():
    """Verify missing or invalid authorization header returns 401 Unauthorized."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"event": {"type": "TEST"}}
        # Missing auth header
        res_no_auth = await client.post("/api/webhooks/revenuecat", json=payload)
        assert res_no_auth.status_code == 401

        # Invalid token
        res_invalid_auth = await client.post(
            "/api/webhooks/revenuecat",
            json=payload,
            headers={"Authorization": "Bearer wrong_token_xyz"},
        )
        assert res_invalid_auth.status_code == 401


@pytest.mark.asyncio
async def test_revenuecat_test_event():
    """Verify RevenueCat TEST event returns 200 OK without errors."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "api_version": "1.0",
            "event": {
                "type": "TEST",
                "id": "test_event_123",
                "app_user_id": "user_test_456",
            },
        }
        response = await client.post(
            "/api/webhooks/revenuecat",
            json=payload,
            headers=AUTH_HEADER,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["event_type"] == "TEST"


@pytest.mark.asyncio
@patch("src.services.entitlements.EntitlementService.update_user_subscription", new_callable=AsyncMock)
async def test_revenuecat_initial_purchase_sync(mock_update):
    """Verify INITIAL_PURCHASE webhook event updates user entitlement to Pro Monthly."""
    mock_update.return_value = {"status": "success"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        exp_time = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp() * 1000)
        payload = {
            "event": {
                "type": "INITIAL_PURCHASE",
                "app_user_id": "user_subscriber_789",
                "product_id": "paperpod_pro_monthly",
                "entitlement_ids": ["pro_access"],
                "expiration_at_ms": exp_time,
            }
        }
        response = await client.post(
            "/api/webhooks/revenuecat",
            json=payload,
            headers=AUTH_HEADER,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["event_type"] == "INITIAL_PURCHASE"

        mock_update.assert_called_once()
        args, kwargs = mock_update.call_args
        assert kwargs.get("user_id") == "user_subscriber_789"
        assert kwargs.get("tier") == EntitlementTier.PRO_MONTHLY


@pytest.mark.asyncio
@patch("src.services.entitlements.EntitlementService.update_user_subscription", new_callable=AsyncMock)
async def test_revenuecat_student_lifetime_sync(mock_update):
    """Verify Student Lifetime purchase grants lifetime entitlement."""
    mock_update.return_value = {"status": "success"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "event": {
                "type": "NON_RENEWING_PURCHASE",
                "app_user_id": "user_student_789",
                "product_id": "paperpod_student_lifetime",
                "entitlement_ids": ["student_pass"],
            }
        }
        response = await client.post(
            "/api/webhooks/revenuecat",
            json=payload,
            headers=AUTH_HEADER,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"

        mock_update.assert_called_once()
        _, kwargs = mock_update.call_args
        assert kwargs.get("user_id") == "user_student_789"
        assert kwargs.get("tier") == EntitlementTier.STUDENT_LIFETIME


@pytest.mark.asyncio
@patch("src.services.entitlements.EntitlementService.update_user_subscription", new_callable=AsyncMock)
async def test_revenuecat_expiration_event(mock_update):
    """Verify EXPIRATION event downgrades user to Free tier."""
    mock_update.return_value = {"status": "success"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "event": {
                "type": "EXPIRATION",
                "app_user_id": "user_expired_789",
                "product_id": "paperpod_pro_monthly",
            }
        }
        response = await client.post(
            "/api/webhooks/revenuecat",
            json=payload,
            headers=AUTH_HEADER,
        )
        assert response.status_code == 200

        mock_update.assert_called_once()
        _, kwargs = mock_update.call_args
        assert kwargs.get("tier") == EntitlementTier.FREE


@pytest.mark.asyncio
async def test_entitlement_api_endpoints():
    """Verify GET and Quota check endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Check conversion quota for test user
        res = await client.post("/api/entitlements/user_test_abc/check-conversion")
        assert res.status_code == 200
        data = res.json()
        assert "allowed" in data
        assert "conversions_limit" in data
        assert data["conversions_limit"] == 2

        # Verify invalid student email returns 400
        res_student_invalid = await client.post(
            "/api/entitlements/user_test_abc/verify-student",
            json={"student_email": "invalid@gmail.com"},
        )
        assert res_student_invalid.status_code == 400

        # Verify valid student email returns 200
        res_student_valid = await client.post(
            "/api/entitlements/user_test_abc/verify-student",
            json={"student_email": "alex@stanford.edu"},
        )
        assert res_student_valid.status_code == 200
        assert res_student_valid.json()["is_student_verified"] is True

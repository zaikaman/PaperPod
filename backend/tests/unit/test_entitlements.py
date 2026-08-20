"""Unit tests for user entitlement calculations and quota management (T048)."""

from datetime import datetime, timedelta, timezone
import pytest

from src.models.schemas import EntitlementTier
from src.services.entitlements import EntitlementService


def test_free_tier_entitlement_defaults():
    """Verify free tier users have 2 weekly conversions and no deep dive access."""
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_free_123",
        tier=EntitlementTier.FREE,
        weekly_conversions_used=0,
    )
    assert entitlements.user_id == "user_free_123"
    assert entitlements.tier == EntitlementTier.FREE
    assert entitlements.weekly_conversions_limit == 2
    assert entitlements.weekly_conversions_used == 0
    assert entitlements.can_convert_paper is True
    assert entitlements.can_access_deep_dives is False


def test_free_tier_quota_limit_reached():
    """Verify free tier users cannot convert once 2 weekly conversions are consumed."""
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_free_123",
        tier=EntitlementTier.FREE,
        weekly_conversions_used=2,
    )
    assert entitlements.can_convert_paper is False
    assert entitlements.weekly_conversions_used == 2
    assert entitlements.weekly_conversions_limit == 2


def test_pro_monthly_entitlements():
    """Verify Pro Monthly users get unlimited conversions and deep dive access."""
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_pro_monthly_123",
        tier=EntitlementTier.PRO_MONTHLY,
        weekly_conversions_used=15,
    )
    assert entitlements.tier == EntitlementTier.PRO_MONTHLY
    assert entitlements.can_convert_paper is True
    assert entitlements.can_access_deep_dives is True
    assert entitlements.weekly_conversions_limit == 9999


def test_student_lifetime_entitlements():
    """Verify Student Lifetime pass grants full pro access without expiration."""
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_student_123",
        tier=EntitlementTier.STUDENT_LIFETIME,
        is_student_verified=True,
        entitlement_expires_at=None,
    )
    assert entitlements.tier == EntitlementTier.STUDENT_LIFETIME
    assert entitlements.is_student_verified is True
    assert entitlements.can_convert_paper is True
    assert entitlements.can_access_deep_dives is True
    assert entitlements.entitlement_expires_at is None


def test_expired_subscription_downgrades_to_free():
    """Verify that an expired subscription automatically reverts capabilities to free tier."""
    past_date = datetime.now(timezone.utc) - timedelta(days=2)
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_expired_123",
        tier=EntitlementTier.PRO_MONTHLY,
        entitlement_expires_at=past_date,
        weekly_conversions_used=2,
    )
    assert entitlements.tier == EntitlementTier.FREE
    assert entitlements.can_convert_paper is False
    assert entitlements.can_access_deep_dives is False


def test_weekly_quota_reset_when_interval_passed():
    """Verify that weekly conversions counter resets to 0 after reset date."""
    past_reset = datetime.now(timezone.utc) - timedelta(hours=1)
    entitlements = EntitlementService.compute_entitlements(
        user_id="user_reset_123",
        tier=EntitlementTier.FREE,
        weekly_conversions_used=2,
        weekly_reset_at=past_reset,
    )
    assert entitlements.weekly_conversions_used == 0
    assert entitlements.can_convert_paper is True
    assert entitlements.weekly_reset_at > datetime.now(timezone.utc)


def test_product_id_tier_mapping():
    """Verify mapping from RevenueCat product identifiers to internal EntitlementTier."""
    assert (
        EntitlementService.get_tier_from_product_id("paperpod_pro_monthly")
        == EntitlementTier.PRO_MONTHLY
    )
    assert (
        EntitlementService.get_tier_from_product_id("paperpod_pro_annual")
        == EntitlementTier.PRO_ANNUAL
    )
    assert (
        EntitlementService.get_tier_from_product_id("paperpod_student_lifetime")
        == EntitlementTier.STUDENT_LIFETIME
    )
    assert (
        EntitlementService.get_tier_from_product_id(None, entitlement_id="student_pass")
        == EntitlementTier.STUDENT_LIFETIME
    )
    assert EntitlementService.get_tier_from_product_id(None) == EntitlementTier.FREE

"""Entitlements & Quotas API Router."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from src.models.schemas import EntitlementTier, UserEntitlementSchema
from src.services.entitlements import FREE_VOICE_INTERRUPTIONS_PER_PAPER, EntitlementService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/entitlements", tags=["Entitlements & Quotas"])


class StudentVerificationRequest(BaseModel):
    student_email: str
    institution_name: str | None = None


class QuotaCheckResponse(BaseModel):
    user_id: str
    allowed: bool
    reason: str | None = None
    conversions_used: int
    conversions_limit: int
    tier: EntitlementTier


class VoiceQuotaCheckResponse(BaseModel):
    user_id: str
    paper_id: str
    allowed: bool
    reason: str | None = None
    questions_used: int
    questions_limit: int
    tier: EntitlementTier


@router.get("/{user_id}", response_model=UserEntitlementSchema)
async def get_user_entitlement_status(user_id: str) -> UserEntitlementSchema:
    """Returns current active subscription tier, limits, and capabilities for a user."""
    return await EntitlementService.get_user_entitlements(user_id)


@router.post("/{user_id}/check-conversion", response_model=QuotaCheckResponse)
async def check_conversion_quota(user_id: str) -> QuotaCheckResponse:
    """Verifies whether the user can ingest/convert another paper this week."""
    entitlement = await EntitlementService.get_user_entitlements(user_id)
    if not entitlement.can_convert_paper:
        return QuotaCheckResponse(
            user_id=user_id,
            allowed=False,
            reason="Free tier weekly paper conversion limit reached (2/2). Upgrade to Pro for unlimited conversions.",
            conversions_used=entitlement.weekly_conversions_used,
            conversions_limit=entitlement.weekly_conversions_limit,
            tier=entitlement.tier,
        )

    return QuotaCheckResponse(
        user_id=user_id,
        allowed=True,
        reason=None,
        conversions_used=entitlement.weekly_conversions_used,
        conversions_limit=entitlement.weekly_conversions_limit,
        tier=entitlement.tier,
    )


@router.post("/{user_id}/consume-conversion", status_code=status.HTTP_200_OK)
async def consume_conversion(user_id: str) -> dict[str, Any]:
    """Records one paper conversion against the user's weekly quota."""
    success = await EntitlementService.increment_conversion_count(user_id)
    entitlement = await EntitlementService.get_user_entitlements(user_id)
    return {
        "status": "success" if success else "limit_reached",
        "conversions_used": entitlement.weekly_conversions_used,
        "conversions_limit": entitlement.weekly_conversions_limit,
    }


@router.post("/{user_id}/verify-student")
async def verify_student_status(user_id: str, request: StudentVerificationRequest) -> dict[str, Any]:
    """Verifies a student academic email (.edu, .ac.uk, etc.) to grant student tier discount."""
    email = request.student_email.lower().strip()
    is_academic = any(
        domain in email
        for domain in [".edu", ".ac.uk", ".edu.au", ".edu.cn", ".ac.in", "student.", ".uni-"]
    )

    if not is_academic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid accredited academic email address (e.g., student@university.edu).",
        )

    # Mark user as student verified in Supabase
    await EntitlementService.update_user_subscription(
        user_id=user_id,
        tier=EntitlementTier.FREE,  # Keep free until they purchase the student lifetime pass
        is_student_verified=True,
    )

    return {
        "status": "verified",
        "message": f"Student status verified for {email}. Student Lifetime pass unlocked at $39.99.",
        "is_student_verified": True,
    }

"""Notification API Endpoints for Topic Digests, Spaced Reminders, and Preferences."""

from typing import Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from src.services.notification_service import (
    NotificationPreference,
    get_notification_service,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications & Digests"])


class SavePreferencesRequest(BaseModel):
    user_id: str
    subscribed_topics: list[str] = Field(default_factory=list)
    digest_frequency: str = "daily_morning"
    digest_time: str = "08:00"
    study_reminders_enabled: bool = True
    reminder_interval_hours: int = 48
    push_token: str | None = None
    onesignal_player_id: str | None = None


class SendDigestRequest(BaseModel):
    topic_id: str = "cs.AI"
    paper_id: str = "paper-attention-1706"
    paper_title: str = "Attention Is All You Need"
    episode_id: str | None = "demo-episode-1706"
    abstract_snippet: str | None = "The Transformer architecture relying on self-attention."
    target_user_id: str | None = None


class SendReminderRequest(BaseModel):
    user_id: str = "00000000-0000-0000-0000-000000000001"
    paper_id: str = "paper-attention-1706"
    paper_title: str = "Attention Is All You Need"
    episode_id: str | None = "demo-episode-1706"
    resume_timestamp_ms: int = 105000  # 01:45


@router.get("/topics", status_code=status.HTTP_200_OK)
async def list_research_topics() -> list[dict[str, Any]]:
    """Returns catalog of research categories available for push subscriptions."""
    service = get_notification_service()
    return service.get_available_topics()


@router.get("/preferences", response_model=NotificationPreference, status_code=status.HTTP_200_OK)
async def get_user_preferences(
    user_id: str = Query(default="00000000-0000-0000-0000-000000000001"),
) -> NotificationPreference:
    """Retrieves user notification and digest settings."""
    service = get_notification_service()
    return service.get_user_preferences(user_id)


@router.post("/preferences", response_model=NotificationPreference, status_code=status.HTTP_200_OK)
async def update_user_preferences(request: SavePreferencesRequest) -> NotificationPreference:
    """Saves user topic subscriptions and reminder cadences."""
    service = get_notification_service()
    return service.save_user_preferences(
        user_id=request.user_id,
        subscribed_topics=request.subscribed_topics,
        digest_frequency=request.digest_frequency,
        digest_time=request.digest_time,
        study_reminders_enabled=request.study_reminders_enabled,
        reminder_interval_hours=request.reminder_interval_hours,
        push_token=request.push_token,
        onesignal_player_id=request.onesignal_player_id,
    )


@router.post("/send-digest", status_code=status.HTTP_200_OK)
async def trigger_topic_digest(request: SendDigestRequest) -> dict[str, Any]:
    """Dispatches or simulates a daily research topic digest notification."""
    service = get_notification_service()
    result = await service.send_topic_digest(
        topic_id=request.topic_id,
        paper_id=request.paper_id,
        paper_title=request.paper_title,
        episode_id=request.episode_id,
        abstract_snippet=request.abstract_snippet,
        target_user_id=request.target_user_id,
    )
    return {
        "status": "success",
        "message": f"Topic digest push dispatched for {request.topic_id}",
        "result": result,
    }


@router.post("/send-reminder", status_code=status.HTTP_200_OK)
async def trigger_study_reminder(request: SendReminderRequest) -> dict[str, Any]:
    """Dispatches or simulates a spaced study reminder notification."""
    service = get_notification_service()
    result = await service.send_study_reminder(
        user_id=request.user_id,
        paper_id=request.paper_id,
        paper_title=request.paper_title,
        episode_id=request.episode_id,
        resume_timestamp_ms=request.resume_timestamp_ms,
    )
    return {
        "status": "success",
        "message": f"Study reminder push dispatched for {request.paper_title}",
        "result": result,
    }

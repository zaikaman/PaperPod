"""Unit tests for OneSignal Notification Service and Deep-Link Payload Generation (T063)."""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from src.models.schemas import EntitlementTier
from src.services.notification_service import (
    NotificationService,
    TopicDigestPayload,
    StudyReminderPayload,
    NotificationPreference,
    RESEARCH_TOPIC_CATALOG,
    get_notification_service,
)


@pytest.fixture
def notif_service() -> NotificationService:
    return NotificationService()


def test_research_topic_catalog_completeness(notif_service: NotificationService) -> None:
    """Verify that all core academic categories are present with proper metadata."""
    topics = notif_service.get_available_topics()
    assert len(topics) >= 6
    
    topic_ids = [t["id"] for t in topics]
    assert "cs.AI" in topic_ids
    assert "cs.RO" in topic_ids
    assert "q-bio" in topic_ids
    assert "quant-ph" in topic_ids
    assert "cs.CV" in topic_ids
    assert "cs.CL" in topic_ids

    for t in topics:
        assert "title" in t
        assert "description" in t
        assert "icon" in t
        assert "subscriber_count" in t


def test_build_topic_digest_payload_structure(notif_service: NotificationService) -> None:
    """Verify topic digest payload formatting and deep-link URL schema."""
    payload: TopicDigestPayload = notif_service.build_topic_digest_payload(
        topic_id="cs.AI",
        topic_name="Artificial Intelligence & ML",
        paper_id="paper-attention-1706",
        paper_title="Attention Is All You Need",
        episode_id="demo-episode-1706",
        abstract_snippet="The Transformer architecture relying entirely on self-attention.",
        target_user_id="00000000-0000-0000-0000-000000000001",
    )

    assert payload.type == "topic_digest"
    assert payload.topic_id == "cs.AI"
    assert payload.paper_id == "paper-attention-1706"
    assert payload.episode_id == "demo-episode-1706"
    assert payload.timestamp_ms == 0
    assert payload.headings["en"] == "Daily Digest: Artificial Intelligence & ML"
    assert "Attention Is All You Need" in payload.contents["en"]
    assert payload.deep_link_url == "paperpod://paper/paper-attention-1706?episode=demo-episode-1706&t=0"
    assert payload.custom_data["paper_id"] == "paper-attention-1706"
    assert payload.custom_data["episode_id"] == "demo-episode-1706"


def test_build_study_reminder_payload_structure(notif_service: NotificationService) -> None:
    """Verify spaced study reminder payload formatting with exact resume timestamp."""
    payload: StudyReminderPayload = notif_service.build_study_reminder_payload(
        user_id="00000000-0000-0000-0000-000000000001",
        paper_id="paper-attention-1706",
        paper_title="Attention Is All You Need",
        episode_id="demo-episode-1706",
        resume_timestamp_ms=105000,  # 01:45
    )

    assert payload.type == "study_reminder"
    assert payload.user_id == "00000000-0000-0000-0000-000000000001"
    assert payload.paper_id == "paper-attention-1706"
    assert payload.episode_id == "demo-episode-1706"
    assert payload.timestamp_ms == 105000
    assert "Resume Your Research Briefing" in payload.headings["en"]
    assert "Attention Is All You Need" in payload.contents["en"]
    assert payload.deep_link_url == "paperpod://paper/paper-attention-1706?episode=demo-episode-1706&t=105000"
    assert payload.custom_data["timestamp_ms"] == 105000


@pytest.mark.asyncio
async def test_dispatch_push_notification_mocked(notif_service: NotificationService) -> None:
    """Verify OneSignal REST API dispatch with mocked HTTP client."""
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "id": "onesignal-notif-uuid-12345",
        "recipients": 1,
        "external_id": None,
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_res
        
        # Test with configured API keys
        with patch.object(notif_service, "app_id", "test-app-id"), \
             patch.object(notif_service, "api_key", "test-api-key"):
            
            result = await notif_service.send_topic_digest(
                topic_id="cs.AI",
                paper_id="paper-attention-1706",
                paper_title="Attention Is All You Need",
                episode_id="demo-episode-1706",
            )

            assert result["id"] == "onesignal-notif-uuid-12345"
            assert result["recipients"] == 1
            assert result["status"] == "sent"
            assert mock_post.called


@pytest.mark.asyncio
async def test_dispatch_push_notification_simulation_fallback(notif_service: NotificationService) -> None:
    """Verify graceful simulation fallback when OneSignal keys are not present."""
    with patch.object(notif_service, "app_id", ""), \
         patch.object(notif_service, "api_key", ""):
        
        result = await notif_service.send_study_reminder(
            user_id="00000000-0000-0000-0000-000000000001",
            paper_id="paper-resnet-1512",
            paper_title="Deep Residual Learning for Image Recognition",
            episode_id="demo-episode-1512",
            resume_timestamp_ms=45000,
        )

        assert result["status"] == "simulated"
        assert result["recipients"] == 1
        assert "deep_link_url" in result["payload"]
        assert "t=45000" in result["payload"]["deep_link_url"]


def test_user_preferences_store_and_retrieve(notif_service: NotificationService) -> None:
    """Verify saving and retrieving topic preferences and digest cadence."""
    user_id = "00000000-0000-0000-0000-000000000002"
    pref = notif_service.save_user_preferences(
        user_id=user_id,
        subscribed_topics=["cs.AI", "cs.RO", "quant-ph"],
        digest_frequency="daily_morning",
        study_reminders_enabled=True,
        reminder_time="08:00",
    )

    assert pref.user_id == user_id
    assert pref.subscribed_topics == ["cs.AI", "cs.RO", "quant-ph"]
    assert pref.digest_frequency == "daily_morning"
    assert pref.study_reminders_enabled is True

    fetched = notif_service.get_user_preferences(user_id)
    assert fetched.subscribed_topics == ["cs.AI", "cs.RO", "quant-ph"]
    assert fetched.digest_frequency == "daily_morning"


@pytest.mark.asyncio
async def test_notifications_api_endpoints() -> None:
    """Verify HTTP API endpoints for notifications: list topics, preferences, send digest & reminder."""
    from httpx import ASGITransport, AsyncClient
    from src.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET /api/v1/notifications/topics
        topics_res = await client.get("/api/v1/notifications/topics")
        assert topics_res.status_code == 200
        topics = topics_res.json()
        assert len(topics) >= 6
        assert any(t["id"] == "cs.AI" for t in topics)

        # 2. POST /api/v1/notifications/preferences
        pref_payload = {
            "user_id": "00000000-0000-0000-0000-000000000001",
            "subscribed_topics": ["cs.AI", "cs.CV"],
            "digest_frequency": "evening_commute",
            "digest_time": "18:00",
            "study_reminders_enabled": True,
            "reminder_interval_hours": 24,
        }
        post_pref_res = await client.post("/api/v1/notifications/preferences", json=pref_payload)
        assert post_pref_res.status_code == 200
        saved_pref = post_pref_res.json()
        assert saved_pref["user_id"] == "00000000-0000-0000-0000-000000000001"
        assert saved_pref["subscribed_topics"] == ["cs.AI", "cs.CV"]
        assert saved_pref["digest_frequency"] == "evening_commute"

        # 3. GET /api/v1/notifications/preferences
        get_pref_res = await client.get("/api/v1/notifications/preferences?user_id=00000000-0000-0000-0000-000000000001")
        assert get_pref_res.status_code == 200
        assert get_pref_res.json()["digest_frequency"] == "evening_commute"

        # 4. POST /api/v1/notifications/send-digest
        digest_res = await client.post(
            "/api/v1/notifications/send-digest",
            json={
                "topic_id": "cs.AI",
                "paper_id": "paper-attention-1706",
                "paper_title": "Attention Is All You Need",
                "episode_id": "demo-episode-1706",
            },
        )
        assert digest_res.status_code == 200
        assert digest_res.json()["status"] == "success"

        # 5. POST /api/v1/notifications/send-reminder
        reminder_res = await client.post(
            "/api/v1/notifications/send-reminder",
            json={
                "user_id": "00000000-0000-0000-0000-000000000001",
                "paper_id": "paper-attention-1706",
                "paper_title": "Attention Is All You Need",
                "episode_id": "demo-episode-1706",
                "resume_timestamp_ms": 60000,
            },
        )
        assert reminder_res.status_code == 200
        assert reminder_res.json()["status"] == "success"


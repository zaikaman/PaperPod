"""PaperPod OneSignal Notification Service Module (T064).
Handles topic digests, spaced study reminders, target segmentation, and deep link payload formatting.
"""

from datetime import datetime, timezone
import logging
from typing import Any
import uuid

import httpx
from pydantic import BaseModel, Field

from src.core.config import get_settings

logger = logging.getLogger("paperpod.notifications")

# Comprehensive Catalog of Academic Research Categories
RESEARCH_TOPIC_CATALOG = [
    {
        "id": "cs.AI",
        "title": "Artificial Intelligence & ML",
        "category_code": "cs.AI",
        "description": "Foundational deep learning, reasoning, agent architectures, and autonomous decision systems.",
        "icon": "Cpu",
        "color": "#06B6D4",
        "subscriber_count": "18,420 Researchers",
        "featured_paper": "Attention Is All You Need",
        "featured_paper_id": "paper-attention-1706",
    },
    {
        "id": "cs.CL",
        "title": "Natural Language & LLMs",
        "category_code": "cs.CL",
        "description": "Transformer models, speech synthesis, prompt optimization, alignment, and multilingual reasoning.",
        "icon": "MessageSquare",
        "color": "#8B5CF6",
        "subscriber_count": "24,850 Researchers",
        "featured_paper": "Language Models are Few-Shot Learners",
        "featured_paper_id": "paper-gpt3-2005",
    },
    {
        "id": "cs.CV",
        "title": "Computer Vision & Graphics",
        "category_code": "cs.CV",
        "description": "Visual understanding, diffusion generative models, 3D Gaussian splatting, and neural rendering.",
        "icon": "Eye",
        "color": "#EC4899",
        "subscriber_count": "15,310 Researchers",
        "featured_paper": "Deep Residual Learning for Image Recognition",
        "featured_paper_id": "paper-resnet-1512",
    },
    {
        "id": "cs.RO",
        "title": "Robotics & Embodied AI",
        "category_code": "cs.RO",
        "description": "Physical manipulation, sim-to-real transfer, spatial navigation, and humanoid actuation control.",
        "icon": "Bot",
        "color": "#F59E0B",
        "subscriber_count": "9,640 Researchers",
        "featured_paper": "RT-2: Vision-Language-Action Models",
        "featured_paper_id": "paper-rt2-2307",
    },
    {
        "id": "q-bio",
        "title": "Computational Biology & Genomics",
        "category_code": "q-bio",
        "description": "Protein folding simulations, CRISPR pathway targeting, molecular dynamics, and digital drug discovery.",
        "icon": "Dna",
        "color": "#10B981",
        "subscriber_count": "8,190 Researchers",
        "featured_paper": "Highly accurate protein structure prediction with AlphaFold",
        "featured_paper_id": "paper-alphafold-2107",
    },
    {
        "id": "quant-ph",
        "title": "Quantum & Theoretical Physics",
        "category_code": "quant-ph",
        "description": "Quantum error correction, superconducting qubits, topological insulators, and tensor networks.",
        "icon": "Sparkles",
        "color": "#3B82F6",
        "subscriber_count": "6,480 Researchers",
        "featured_paper": "Quantum Computational Advantage using Photons",
        "featured_paper_id": "paper-quantum-2012",
    },
    {
        "id": "q-bio.NC",
        "title": "Neuroscience & Cognitive AI",
        "category_code": "q-bio.NC",
        "description": "Neural coding mechanisms, brain-computer interfaces, connectomics, and biological memory models.",
        "icon": "Brain",
        "color": "#A855F7",
        "subscriber_count": "5,920 Researchers",
        "featured_paper": "A Neural Algorithm of Artistic Style",
        "featured_paper_id": "paper-neural-1508",
    },
    {
        "id": "cs.CR",
        "title": "Cryptography & AI Safety",
        "category_code": "cs.CR",
        "description": "Post-quantum cryptography, differential privacy, red-teaming safety, and zero-knowledge proofs.",
        "icon": "ShieldCheck",
        "color": "#14B8A6",
        "subscriber_count": "7,350 Researchers",
        "featured_paper": "Scalable Agent Red-Teaming & Alignment",
        "featured_paper_id": "paper-alignment-2401",
    },
]


class TopicDigestPayload(BaseModel):
    id: str = Field(default_factory=lambda: f"digest-{uuid.uuid4().hex[:8]}")
    type: str = "topic_digest"
    topic_id: str
    topic_name: str
    paper_id: str
    paper_title: str
    episode_id: str | None = None
    timestamp_ms: int = 0
    headings: dict[str, str]
    contents: dict[str, str]
    deep_link_url: str
    custom_data: dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StudyReminderPayload(BaseModel):
    id: str = Field(default_factory=lambda: f"reminder-{uuid.uuid4().hex[:8]}")
    type: str = "study_reminder"
    user_id: str
    paper_id: str
    paper_title: str
    episode_id: str | None = None
    timestamp_ms: int = 0
    headings: dict[str, str]
    contents: dict[str, str]
    deep_link_url: str
    custom_data: dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NotificationPreference(BaseModel):
    user_id: str
    subscribed_topics: list[str] = Field(default_factory=lambda: ["cs.AI", "cs.CL"])
    digest_frequency: str = "daily_morning"  # 'daily_morning' | 'evening_commute' | 'weekly_digest' | 'disabled'
    digest_time: str = "08:00"
    reminder_time: str | None = "08:00"
    study_reminders_enabled: bool = True
    reminder_interval_hours: int = 48
    push_token: str | None = None
    onesignal_player_id: str | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# In-memory preference storage for development & testing
_PREFERENCES_STORE: dict[str, NotificationPreference] = {}


class NotificationService:
    """Service for OneSignal Push Notification generation, scheduling, and delivery."""

    def __init__(self) -> None:
        settings = get_settings()
        self.app_id: str = settings.ONESIGNAL_APP_ID
        self.api_key: str = settings.ONESIGNAL_REST_API_KEY
        self.api_url: str = "https://onesignal.com/api/v1/notifications"

    def get_available_topics(self) -> list[dict[str, Any]]:
        """Returns list of curated academic research domains with metadata."""
        return RESEARCH_TOPIC_CATALOG

    def build_topic_digest_payload(
        self,
        topic_id: str,
        topic_name: str,
        paper_id: str,
        paper_title: str,
        episode_id: str | None = None,
        abstract_snippet: str | None = None,
        target_user_id: str | None = None,
    ) -> TopicDigestPayload:
        """Constructs structured topic digest notification payload with deep-link URL."""
        target_ep = episode_id or f"ep-{paper_id}"
        deep_link = f"paperpod://paper/{paper_id}?episode={target_ep}&t=0"

        headings = {"en": f"Daily Digest: {topic_name}"}
        snippet = f": '{abstract_snippet[:100]}...'" if abstract_snippet else ""
        contents = {
            "en": f"Today's top paper in {topic_name}: {paper_title}{snippet} Tap to listen to the 2-host audio briefing."
        }

        custom_data = {
            "type": "topic_digest",
            "topic_id": topic_id,
            "paper_id": paper_id,
            "episode_id": target_ep,
            "timestamp_ms": 0,
            "deep_link_url": deep_link,
            "target_user_id": target_user_id,
        }

        return TopicDigestPayload(
            topic_id=topic_id,
            topic_name=topic_name,
            paper_id=paper_id,
            paper_title=paper_title,
            episode_id=target_ep,
            timestamp_ms=0,
            headings=headings,
            contents=contents,
            deep_link_url=deep_link,
            custom_data=custom_data,
        )

    def build_study_reminder_payload(
        self,
        user_id: str,
        paper_id: str,
        paper_title: str,
        episode_id: str | None = None,
        resume_timestamp_ms: int = 0,
    ) -> StudyReminderPayload:
        """Constructs spaced research study reminder payload with exact playback resume position."""
        target_ep = episode_id or f"ep-{paper_id}"
        deep_link = f"paperpod://paper/{paper_id}?episode={target_ep}&t={resume_timestamp_ms}"

        mins = resume_timestamp_ms // 60000
        secs = (resume_timestamp_ms % 60000) // 1000
        time_str = f"{mins:02d}:{secs:02d}"

        headings = {"en": "Resume Your Research Briefing"}
        contents = {
            "en": f"Continue '{paper_title}' where you left off at {time_str}. Alex & Dr. Taylor are ready."
        }

        custom_data = {
            "type": "study_reminder",
            "user_id": user_id,
            "paper_id": paper_id,
            "episode_id": target_ep,
            "timestamp_ms": resume_timestamp_ms,
            "deep_link_url": deep_link,
        }

        return StudyReminderPayload(
            user_id=user_id,
            paper_id=paper_id,
            paper_title=paper_title,
            episode_id=target_ep,
            timestamp_ms=resume_timestamp_ms,
            headings=headings,
            contents=contents,
            deep_link_url=deep_link,
            custom_data=custom_data,
        )

    async def dispatch_push_notification(
        self,
        headings: dict[str, str],
        contents: dict[str, str],
        custom_data: dict[str, Any],
        deep_link_url: str,
        target_user_ids: list[str] | None = None,
        target_topic_tag: str | None = None,
    ) -> dict[str, Any]:
        """Dispatches push notification via OneSignal REST API or falls back to simulation."""
        # Check if OneSignal credentials are configured
        if not self.app_id or not self.api_key:
            logger.info("[OneSignal] API Key or App ID not configured. Simulating push notification delivery.")
            return {
                "id": f"simulated-{uuid.uuid4().hex}",
                "recipients": 1,
                "status": "simulated",
                "simulated": True,
                "payload": {
                    "headings": headings,
                    "contents": contents,
                    "data": custom_data,
                    "deep_link_url": deep_link_url,
                },
            }

        # Build OneSignal REST API payload
        payload: dict[str, Any] = {
            "app_id": self.app_id,
            "headings": headings,
            "contents": contents,
            "data": custom_data,
            "url": deep_link_url,
            "app_url": deep_link_url,
            "ios_badgeType": "Increase",
            "ios_badgeCount": 1,
            "android_channel_id": "paperpod_research_alerts",
        }

        if target_user_ids:
            payload["include_external_user_ids"] = target_user_ids
        elif target_topic_tag:
            payload["filters"] = [
                {"field": "tag", "key": f"topic_{target_topic_tag.replace('.', '_')}", "relation": "=", "value": "1"}
            ]
        else:
            payload["included_segments"] = ["Subscribed Users", "Active Researchers"]

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    self.api_url,
                    json=payload,
                    headers={
                        "Authorization": f"Basic {self.api_key}",
                        "Content-Type": "application/json",
                    },
                )
                if res.status_code in (200, 202):
                    data = res.json()
                    logger.info(f"[OneSignal] Push sent successfully: {data.get('id')}")
                    return {
                        "id": data.get("id", f"notif-{uuid.uuid4().hex[:8]}"),
                        "recipients": data.get("recipients", 1),
                        "status": "sent",
                        "simulated": False,
                    }
                else:
                    logger.warning(f"[OneSignal] Push failed ({res.status_code}): {res.text}")
                    return {
                        "id": f"fallback-{uuid.uuid4().hex[:8]}",
                        "recipients": 0,
                        "status": "failed",
                        "error": res.text,
                    }
        except Exception as e:
            logger.error(f"[OneSignal] Push network error: {e}", exc_info=True)
            return {
                "id": f"simulated-{uuid.uuid4().hex}",
                "recipients": 1,
                "status": "simulated",
                "simulated": True,
                "error": str(e),
                "payload": {
                    "headings": headings,
                    "contents": contents,
                    "data": custom_data,
                    "deep_link_url": deep_link_url,
                },
            }

    async def send_topic_digest(
        self,
        topic_id: str,
        paper_id: str,
        paper_title: str,
        episode_id: str | None = None,
        abstract_snippet: str | None = None,
        target_user_id: str | None = None,
    ) -> dict[str, Any]:
        """Formats and dispatches a topic digest notification."""
        topic_meta = next((t for t in RESEARCH_TOPIC_CATALOG if t["id"] == topic_id), None)
        topic_name = topic_meta["title"] if topic_meta else topic_id

        digest = self.build_topic_digest_payload(
            topic_id=topic_id,
            topic_name=topic_name,
            paper_id=paper_id,
            paper_title=paper_title,
            episode_id=episode_id,
            abstract_snippet=abstract_snippet,
            target_user_id=target_user_id,
        )

        user_targets = [target_user_id] if target_user_id else None
        return await self.dispatch_push_notification(
            headings=digest.headings,
            contents=digest.contents,
            custom_data=digest.custom_data,
            deep_link_url=digest.deep_link_url,
            target_user_ids=user_targets,
            target_topic_tag=topic_id if not user_targets else None,
        )

    async def send_study_reminder(
        self,
        user_id: str,
        paper_id: str,
        paper_title: str,
        episode_id: str | None = None,
        resume_timestamp_ms: int = 0,
    ) -> dict[str, Any]:
        """Formats and dispatches a spaced study reminder notification."""
        reminder = self.build_study_reminder_payload(
            user_id=user_id,
            paper_id=paper_id,
            paper_title=paper_title,
            episode_id=episode_id,
            resume_timestamp_ms=resume_timestamp_ms,
        )

        return await self.dispatch_push_notification(
            headings=reminder.headings,
            contents=reminder.contents,
            custom_data=reminder.custom_data,
            deep_link_url=reminder.deep_link_url,
            target_user_ids=[user_id],
        )

    def save_user_preferences(
        self,
        user_id: str,
        subscribed_topics: list[str],
        digest_frequency: str = "daily_morning",
        digest_time: str = "08:00",
        reminder_time: str | None = None,
        study_reminders_enabled: bool = True,
        reminder_interval_hours: int = 48,
        push_token: str | None = None,
        onesignal_player_id: str | None = None,
    ) -> NotificationPreference:
        """Persists notification preferences for a user."""
        actual_time = reminder_time or digest_time
        pref = NotificationPreference(
            user_id=user_id,
            subscribed_topics=subscribed_topics,
            digest_frequency=digest_frequency,
            digest_time=actual_time,
            reminder_time=actual_time,
            study_reminders_enabled=study_reminders_enabled,
            reminder_interval_hours=reminder_interval_hours,
            push_token=push_token,
            onesignal_player_id=onesignal_player_id,
            updated_at=datetime.now(timezone.utc),
        )
        _PREFERENCES_STORE[user_id] = pref
        return pref

    def get_user_preferences(self, user_id: str) -> NotificationPreference:
        """Retrieves stored notification preferences or returns sensible defaults."""
        if user_id not in _PREFERENCES_STORE:
            _PREFERENCES_STORE[user_id] = NotificationPreference(user_id=user_id)
        return _PREFERENCES_STORE[user_id]


_notification_service_instance: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """Returns singleton NotificationService instance."""
    global _notification_service_instance
    if _notification_service_instance is None:
        _notification_service_instance = NotificationService()
    return _notification_service_instance

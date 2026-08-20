"""Pydantic V2 Schemas for PaperPod Data Models & API Contracts."""

from datetime import date, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class PaperSourceType(StrEnum):
    PDF_UPLOAD = "pdf_upload"
    ARXIV_URL = "arxiv_url"
    WEB_URL = "web_url"


class PaperStatus(StrEnum):
    PENDING = "pending"
    PARSING = "parsing"
    READY = "ready"
    FAILED = "failed"


class EpisodeDepthType(StrEnum):
    EXECUTIVE_BRIEF = "executive_brief"
    DEEP_DIVE = "deep_dive"


class EpisodeStatus(StrEnum):
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


class SpeakerRole(StrEnum):
    ALEX = "alex"
    TAYLOR = "taylor"


class EntitlementTier(StrEnum):
    FREE = "free"
    PRO_MONTHLY = "pro_monthly"
    PRO_ANNUAL = "pro_annual"
    STUDENT_LIFETIME = "student_lifetime"


# ============================================================================
# Core Entity Schemas
# ============================================================================


class BoundingBox(BaseModel):
    x0: float = Field(..., description="Left coordinate in PDF points")
    y0: float = Field(..., description="Top coordinate in PDF points")
    x1: float = Field(..., description="Right coordinate in PDF points")
    y1: float = Field(..., description="Bottom coordinate in PDF points")


class PaperFigureSchema(BaseModel):
    id: str | None = None
    paper_id: str | None = None
    figure_number: str = Field(..., json_schema_extra={"example": "Figure 1"})
    caption: str = Field(
        ..., json_schema_extra={"example": "Transformer model architecture diagram."}
    )
    storage_path: str = Field(..., description="Path in Supabase Storage figures bucket")
    public_url: str | None = None
    page_number: int = Field(..., ge=1)
    bounding_box: BoundingBox
    aspect_ratio: float = Field(default=1.0)
    created_at: datetime | None = None


class PaperSectionSchema(BaseModel):
    id: str | None = None
    paper_id: str | None = None
    section_index: int
    heading: str = Field(..., json_schema_extra={"example": "3. Model Architecture"})
    content_text: str
    latex_equations: list[str] = Field(default_factory=list)
    embedding: list[float] | None = None
    created_at: datetime | None = None


class PaperSchema(BaseModel):
    id: str
    user_id: str | None = None
    title: str
    authors: list[str] = Field(default_factory=list)
    publication_date: date | None = None
    arxiv_id: str | None = None
    source_type: PaperSourceType
    source_url: str | None = None
    pdf_storage_path: str
    pdf_public_url: str | None = None
    abstract: str | None = None
    total_pages: int = 1
    status: PaperStatus = PaperStatus.PENDING
    error_message: str | None = None
    sections: list[PaperSectionSchema] = Field(default_factory=list)
    figures: list[PaperFigureSchema] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WordTimingSchema(BaseModel):
    text: str
    start_ms: int = Field(..., ge=0)
    end_ms: int = Field(..., ge=0)


class DialogueSegmentSchema(BaseModel):
    id: str | None = None
    episode_id: str | None = None
    sequence_index: int
    speaker: SpeakerRole
    dialogue_text: str
    audio_start_ms: int = Field(..., ge=0)
    audio_end_ms: int = Field(..., ge=0)
    referenced_figure_id: str | None = None
    referenced_figure: PaperFigureSchema | None = None
    words: list[WordTimingSchema] = Field(default_factory=list)


class EpisodeSchema(BaseModel):
    id: str
    paper_id: str
    user_id: str
    depth_type: EpisodeDepthType = EpisodeDepthType.EXECUTIVE_BRIEF
    duration_seconds: int = 0
    audio_storage_path: str
    audio_url: str | None = None
    status: EpisodeStatus = EpisodeStatus.GENERATING
    segments: list[DialogueSegmentSchema] = Field(default_factory=list)
    created_at: datetime | None = None


# ============================================================================
# API Request / Response Schemas
# ============================================================================


class ArxivIngestRequest(BaseModel):
    arxiv_url_or_id: str = Field(
        ...,
        json_schema_extra={"example": "https://arxiv.org/abs/1706.03762"},
        description="arXiv link or standard arXiv ID (e.g. 1706.03762)",
    )
    user_id: str | None = None


class IngestionProgressResponse(BaseModel):
    paper_id: str
    status: PaperStatus
    progress_percentage: int = Field(..., ge=0, le=100)
    current_step: str = Field(
        ..., json_schema_extra={"example": "Extracting figures and math equations..."}
    )
    error_message: str | None = None


class GenerateEpisodeRequest(BaseModel):
    paper_id: str
    user_id: str
    depth_type: EpisodeDepthType = EpisodeDepthType.EXECUTIVE_BRIEF


class VoiceInterruptionRequest(BaseModel):
    episode_id: str
    user_id: str
    trigger_timestamp_ms: int
    query_text: str


class VoiceInterruptionResponse(BaseModel):
    interruption_id: str
    query_text: str
    response_text: str
    response_audio_url: str | None = None
    latency_ms: int
    resume_timestamp_ms: int


class SummaryCardSchema(BaseModel):
    id: str | None = None
    paper_id: str
    core_thesis: str
    quantitative_results: list[dict[str, Any]] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    future_work: list[str] = Field(default_factory=list)
    card_pdf_url: str | None = None
    created_at: datetime | None = None


class AudioBookmarkSchema(BaseModel):
    id: str | None = None
    episode_id: str
    user_id: str
    timestamp_ms: int
    note_text: str | None = None
    created_at: datetime | None = None


class UserEntitlementSchema(BaseModel):
    user_id: str
    tier: EntitlementTier = EntitlementTier.FREE
    revenuecat_customer_id: str | None = None
    weekly_conversions_used: int = 0
    weekly_conversions_limit: int = 2
    weekly_reset_at: datetime
    is_student_verified: bool = False
    entitlement_expires_at: datetime | None = None
    can_convert_paper: bool = True
    can_interrupt_voice: bool = True
    can_access_deep_dives: bool = False

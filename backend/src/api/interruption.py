"""Live Voice Interruption & In-Context Clarification API Router."""

import io
import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.api.papers import _local_episodes_db, _local_papers_db
from src.core.supabase_client import get_supabase
from src.services.interruption import generate_interruption_clarification
from src.services.interruption_tts import (
    get_cached_interruption_audio,
    synthesize_clarification_audio,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/episodes", tags=["Live Voice Interruption"])

# In-memory log of interruption interactions
_local_interruption_logs: dict[str, dict[str, Any]] = {}


class LiveInterruptionRequest(BaseModel):
    playback_timestamp_ms: int = Field(
        default=0,
        ge=0,
        description="Current playback scrubber position in milliseconds",
    )
    query_text: str = Field(
        ...,
        min_length=1,
        description="Spoken or typed user question for Dr. Taylor",
        json_schema_extra={"example": "Wait, why do we divide by sqrt(d_k) in equation 1?"},
    )
    user_id: str | None = Field(
        default="00000000-0000-0000-0000-000000000001",
        description="User identifier",
    )


class InterruptionClarificationResponse(BaseModel):
    interruption_id: str
    clarification_text: str
    audio_url: str
    duration_ms: int
    resume_timestamp_ms: int
    relevant_section_heading: str | None = None
    latency_ms: int


@router.post(
    "/{episode_id}/interrupt",
    response_model=InterruptionClarificationResponse,
    status_code=status.HTTP_200_OK,
)
async def submit_voice_interruption(
    episode_id: str,
    request: LiveInterruptionRequest,
) -> dict[str, Any]:
    """Handles live user voice/text interruption during podcast playback.

    Pauses context, queries paper section vectors, prompts Dr. Taylor for concise 2-sentence
    explanation, synthesizes neural speech snippet, and returns resume timeline markers.
    """
    start_time = time.perf_counter()
    interruption_id = f"int-{uuid.uuid4().hex[:12]}"

    logger.info(
        f"Processing voice interruption for episode '{episode_id}' at {request.playback_timestamp_ms}ms: "
        f"'{request.query_text}'"
    )

    # 1. Retrieve episode and associated paper
    episode = _local_episodes_db.get(episode_id)
    if not episode and episode_id != "demo-episode-1706":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Episode with ID '{episode_id}' not found.",
        )

    paper_id = episode.get("paper_id", "paper-attention-1706") if episode else "paper-attention-1706"
    paper = _local_papers_db.get(paper_id, {})

    # 2. Identify active dialogue segment
    active_segment = None
    segments = episode.get("segments", []) if episode else []
    for seg in segments:
        if seg.get("audio_start_ms", 0) <= request.playback_timestamp_ms <= seg.get("audio_end_ms", 999999):
            active_segment = seg
            break

    # 3. Generate Dr. Taylor's spoken clarification via RAG + Gemini Flash Lite
    clarification_text, section_heading = await generate_interruption_clarification(
        paper_data=paper,
        playback_timestamp_ms=request.playback_timestamp_ms,
        query_text=request.query_text,
        active_segment=active_segment,
    )

    # 4. Synthesize rapid single-turn neural audio
    audio_bytes, duration_ms, stream_url = await synthesize_clarification_audio(
        text=clarification_text,
        interruption_id=interruption_id,
    )

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    # 5. Record interruption log
    log_record = {
        "id": interruption_id,
        "episode_id": episode_id,
        "user_id": request.user_id,
        "trigger_timestamp_ms": request.playback_timestamp_ms,
        "query_text": request.query_text,
        "response_text": clarification_text,
        "response_audio_url": stream_url,
        "duration_ms": duration_ms,
        "relevant_section_heading": section_heading,
        "latency_ms": latency_ms,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _local_interruption_logs[interruption_id] = log_record

    # Try logging to Supabase if available
    try:
        supabase = get_supabase()
        supabase.table("voice_interruption_logs").insert({
            "id": interruption_id,
            "episode_id": episode_id if len(episode_id) == 36 else None,
            "user_id": request.user_id if len(request.user_id or "") == 36 else None,
            "trigger_timestamp_ms": request.playback_timestamp_ms,
            "query_text": request.query_text,
            "response_text": clarification_text,
            "response_audio_url": stream_url,
            "latency_ms": latency_ms,
        }).execute()
    except Exception as e:
        logger.debug(f"Supabase interruption log notice: {e}")

    logger.info(f"Interruption answered in {latency_ms}ms (Duration: {duration_ms}ms).")

    return {
        "interruption_id": interruption_id,
        "clarification_text": clarification_text,
        "audio_url": stream_url,
        "duration_ms": duration_ms,
        "resume_timestamp_ms": request.playback_timestamp_ms,
        "relevant_section_heading": section_heading,
        "latency_ms": latency_ms,
    }


@router.get(
    "/interruptions/{interruption_id}/stream",
    status_code=status.HTTP_200_OK,
)
async def stream_interruption_audio(interruption_id: str) -> Response:
    """Streams the synthesized MP3 audio for a specific clarification answer."""
    audio_bytes = get_cached_interruption_audio(interruption_id)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio for interruption ID '{interruption_id}' not found.",
        )

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"inline; filename={interruption_id}.mp3",
            "Content-Length": str(len(audio_bytes)),
            "Accept-Ranges": "bytes",
        },
    )


@router.get(
    "/{episode_id}/interruptions",
    status_code=status.HTTP_200_OK,
)
async def list_episode_interruptions(episode_id: str) -> list[dict[str, Any]]:
    """Lists all historical voice interruptions for a given episode."""
    results = [
        item for item in _local_interruption_logs.values()
        if item.get("episode_id") == episode_id
    ]
    return results

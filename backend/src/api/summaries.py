"""Summary Card and Audio Bookmarks API Router (T059)."""

from datetime import datetime, timezone
import logging
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from src.api.papers import _local_episodes_db, _local_papers_db
from src.core.supabase_client import get_supabase_client
from src.models.schemas import AudioBookmarkSchema, SummaryCardSchema
from src.services.summary_gen import generate_summary_card

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Summary Cards & Bookmarks"])

# In-memory caches for fast local testing and demo records
_local_summary_cards_db: dict[str, dict[str, Any]] = {
    "paper-attention-1706": {
        "id": "summary-card-1706",
        "paper_id": "paper-attention-1706",
        "core_thesis": "The Transformer is the first sequence transduction model based entirely on self-attention, replacing recurrent layers (RNNs/LSTMs) and convolutional architectures to achieve massive parallelization, superior translation quality, and significantly faster training times.",
        "quantitative_results": [
            {
                "metric": "WMT 2014 EN-DE BLEU Score",
                "baseline": "26.3 BLEU (ByteNet / ConvS2S)",
                "paper_result": "28.4 BLEU",
                "improvement": "+2.1 BLEU (New SOTA)",
            },
            {
                "metric": "WMT 2014 EN-FR BLEU Score",
                "baseline": "41.0 BLEU (MoE / Deep-Attn)",
                "paper_result": "41.8 BLEU",
                "improvement": "+0.8 BLEU (Single Model SOTA)",
            },
            {
                "metric": "Training Cost (EN-DE)",
                "baseline": "1.0e20 FLOPs (ConvS2S)",
                "paper_result": "3.3e18 FLOPs",
                "improvement": "1/30th FLOPs (3.5 days on 8 P100 GPUs)",
            },
            {
                "metric": "Sequential Execution Path",
                "baseline": "O(n) per layer",
                "paper_result": "O(1) constant path",
                "improvement": "100% Parallel Training",
            },
        ],
        "limitations": [
            "Quadratic computational and memory complexity O(n^2) with respect to input sequence length n in full self-attention.",
            "Lack of inherent recurrence requires explicit sinusoidal or learned positional encodings to capture word order.",
            "Autoregressive generation at inference time remains sequential token-by-token despite parallel training.",
        ],
        "future_work": [
            "Extending attention-based models to inputs beyond text, including image, audio, and video synthesis.",
            "Developing linear or sparse attention approximations to handle long documents and multi-megabyte context windows.",
            "Investigating local and restricted attention mechanisms to reduce memory footprints for edge deployment.",
        ],
        "card_pdf_url": "https://storage.paperpod.ai/summaries/1706.03762_summary.pdf",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
}

_local_bookmarks_db: dict[str, dict[str, Any]] = {
    "bm-demo-001": {
        "id": "bm-demo-001",
        "episode_id": "demo-episode-1706",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "timestamp_ms": 14500,
        "note_text": "Dr. Taylor explaining why dividing by sqrt(d_k) prevents softmax saturation.",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "bm-demo-002": {
        "id": "bm-demo-002",
        "episode_id": "demo-episode-1706",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "timestamp_ms": 32000,
        "note_text": "Figure 1 Multi-Head Attention architectural breakdown.",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
}


class CreateBookmarkRequest(BaseModel):
    user_id: str = "00000000-0000-0000-0000-000000000001"
    timestamp_ms: int = Field(..., ge=0, description="Audio offset in milliseconds")
    note_text: str | None = Field(default=None, description="Optional timestamped note")


# ============================================================================
# Summary Card Endpoints
# ============================================================================


@router.get("/papers/{paper_id}/summary", status_code=status.HTTP_200_OK)
async def get_paper_summary_card(paper_id: str) -> dict[str, Any]:
    """Retrieves or auto-generates the high-density 1-page summary card for a paper."""
    # 1. Check local cache / database
    if paper_id in _local_summary_cards_db:
        return _local_summary_cards_db[paper_id]

    supabase = get_supabase_client()
    if supabase:
        try:
            res = (
                supabase.table("summary_cards")
                .select("*")
                .eq("paper_id", paper_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                card = res.data[0]
                _local_summary_cards_db[paper_id] = card
                return card
        except Exception as e:
            logger.warning(f"Error querying Supabase summary_cards: {e}")

    # 2. Fetch paper metadata to generate summary card
    paper = _local_papers_db.get(paper_id)
    if not paper and supabase:
        try:
            p_res = (
                supabase.table("papers")
                .select("*, paper_sections(*), paper_figures(*)")
                .eq("id", paper_id)
                .single()
                .execute()
            )
            if p_res.data:
                paper = p_res.data
        except Exception as e:
            logger.warning(f"Error querying Supabase papers: {e}")

    if not paper:
        # Fallback default paper structure if ID not found
        paper = {
            "id": paper_id,
            "title": f"Research Paper ({paper_id})",
            "abstract": "Academic research paper covering architectural advances and quantitative benchmarks.",
            "sections": [],
        }

    # 3. Generate summary card using Gemini 3.1 Flash Lite
    generated_card = await generate_summary_card(paper)

    card_record = {
        "id": f"summary-card-{uuid.uuid4().hex[:8]}",
        "paper_id": paper_id,
        "core_thesis": generated_card.core_thesis,
        "quantitative_results": [q.model_dump() for q in generated_card.quantitative_results],
        "limitations": generated_card.limitations,
        "future_work": generated_card.future_work,
        "card_pdf_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Persist in cache and DB
    _local_summary_cards_db[paper_id] = card_record

    if supabase:
        try:
            supabase.table("summary_cards").insert(card_record).execute()
        except Exception as e:
            logger.warning(f"Error saving summary card to Supabase: {e}")

    return card_record


@router.post("/papers/{paper_id}/summary", status_code=status.HTTP_200_OK)
async def generate_paper_summary_card_endpoint(paper_id: str) -> dict[str, Any]:
    """Forces regeneration of the high-density 1-page summary card using Gemini 3.1 Flash Lite."""
    paper = _local_papers_db.get(paper_id)
    supabase = get_supabase_client()

    if not paper and supabase:
        try:
            p_res = (
                supabase.table("papers")
                .select("*, paper_sections(*), paper_figures(*)")
                .eq("id", paper_id)
                .single()
                .execute()
            )
            if p_res.data:
                paper = p_res.data
        except Exception as e:
            logger.warning(f"Error querying Supabase papers: {e}")

    if not paper:
        paper = {
            "id": paper_id,
            "title": f"Research Paper ({paper_id})",
            "abstract": "Academic research paper covering architectural advances and quantitative benchmarks.",
            "sections": [],
        }

    generated_card = await generate_summary_card(paper)

    card_record = {
        "id": f"summary-card-{uuid.uuid4().hex[:8]}",
        "paper_id": paper_id,
        "core_thesis": generated_card.core_thesis,
        "quantitative_results": [q.model_dump() for q in generated_card.quantitative_results],
        "limitations": generated_card.limitations,
        "future_work": generated_card.future_work,
        "card_pdf_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _local_summary_cards_db[paper_id] = card_record

    if supabase:
        try:
            supabase.table("summary_cards").insert(card_record).execute()
        except Exception as e:
            logger.warning(f"Error saving summary card to Supabase: {e}")

    return card_record


# ============================================================================
# Audio Bookmarks Endpoints
# ============================================================================


@router.post("/episodes/{episode_id}/bookmarks", status_code=status.HTTP_201_CREATED)
async def create_audio_bookmark(
    episode_id: str, payload: CreateBookmarkRequest
) -> dict[str, Any]:
    """Saves a timestamped audio bookmark with optional user notation during playback."""
    bookmark_id = f"bm-{uuid.uuid4().hex[:8]}"
    bookmark_record = {
        "id": bookmark_id,
        "episode_id": episode_id,
        "user_id": payload.user_id,
        "timestamp_ms": payload.timestamp_ms,
        "note_text": payload.note_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _local_bookmarks_db[bookmark_id] = bookmark_record

    supabase = get_supabase_client()
    if supabase:
        try:
            supabase.table("audio_bookmarks").insert(bookmark_record).execute()
        except Exception as e:
            logger.warning(f"Error inserting bookmark to Supabase: {e}")

    return {
        "status": "created",
        "message": "Bookmark created successfully.",
        "bookmark": bookmark_record,
    }


@router.get("/episodes/{episode_id}/bookmarks", status_code=status.HTTP_200_OK)
async def list_episode_bookmarks(
    episode_id: str,
    user_id: str | None = Query(default=None),
) -> list[dict[str, Any]]:
    """Returns all saved audio bookmarks for an episode ordered chronologically."""
    supabase = get_supabase_client()
    if supabase:
        try:
            query = (
                supabase.table("audio_bookmarks")
                .select("*")
                .eq("episode_id", episode_id)
            )
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.order("timestamp_ms", desc=False).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Error fetching bookmarks from Supabase: {e}")

    # Fallback to local store
    results = [
        bm for bm in _local_bookmarks_db.values()
        if bm.get("episode_id") == episode_id
        and (not user_id or bm.get("user_id") == user_id)
    ]
    results.sort(key=lambda x: x.get("timestamp_ms", 0))
    return results


@router.delete("/bookmarks/{bookmark_id}", status_code=status.HTTP_200_OK)
async def delete_audio_bookmark(bookmark_id: str) -> dict[str, Any]:
    """Deletes an audio bookmark by ID."""
    found = False
    if bookmark_id in _local_bookmarks_db:
        del _local_bookmarks_db[bookmark_id]
        found = True

    supabase = get_supabase_client()
    if supabase:
        try:
            res = supabase.table("audio_bookmarks").delete().eq("id", bookmark_id).execute()
            if res.data and len(res.data) > 0:
                found = True
        except Exception as e:
            logger.warning(f"Error deleting bookmark from Supabase: {e}")

    return {
        "status": "deleted",
        "message": f"Bookmark '{bookmark_id}' deleted successfully.",
        "bookmark_id": bookmark_id,
    }

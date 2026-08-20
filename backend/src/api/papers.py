"""Paper ingestion and episode generation API router."""

import logging
import uuid
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from src.core.config import get_settings
from src.core.supabase_client import get_storage_public_url, upload_storage_file
from src.models.schemas import (
    ArxivIngestRequest,
    EpisodeDepthType,
    EpisodeStatus,
    PaperSourceType,
    PaperStatus,
)
from src.services.arxiv_fetcher import fetch_arxiv_paper
from src.services.audio_tts import synthesize_full_episode
from src.services.parser import parse_pdf_document
from src.services.script_gen import generate_podcast_script

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/papers", tags=["Papers & Ingestion"])

# In-memory storage cache with pre-seeded demo records for instant playback
_local_papers_db: dict[str, dict[str, Any]] = {
    "paper-attention-1706": {
        "id": "paper-attention-1706",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "title": "Attention Is All You Need",
        "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
        "abstract": "We propose the Transformer, a model architecture relying entirely on self-attention mechanisms to compute representations of its input and output without using sequence-aligned RNNs or convolution.",
        "total_pages": 15,
        "source_type": "arxiv_url",
        "source_url": "https://arxiv.org/abs/1706.03762",
        "arxiv_id": "1706.03762",
        "pdf_storage_path": "papers/1706.03762.pdf",
        "pdf_public_url": "https://arxiv.org/pdf/1706.03762.pdf",
        "status": "ready",
        "sections": [
            {
                "section_index": 1,
                "heading": "1. Introduction & Motivation",
                "content_text": "Recurrent neural networks typically factor computation along the symbol positions of the input and output sequences.",
                "latex_equations": [],
            },
            {
                "section_index": 2,
                "heading": "3. Model Architecture",
                "content_text": "The Transformer follows an encoder-decoder structure using stacked self-attention and point-wise fully connected layers.",
                "latex_equations": ["Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V"],
            },
        ],
        "figures": [
            {
                "figure_number": "Figure 1",
                "caption": "Figure 1: The Transformer - model architecture.",
                "page_number": 3,
                "bounding_box": {"x0": 50.0, "y0": 100.0, "x1": 500.0, "y1": 450.0},
                "aspect_ratio": 1.15,
            }
        ],
    },
    "paper-resnet-1512": {
        "id": "paper-resnet-1512",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "title": "Deep Residual Learning for Image Recognition",
        "authors": ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
        "abstract": "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
        "total_pages": 12,
        "source_type": "arxiv_url",
        "source_url": "https://arxiv.org/abs/1512.03385",
        "arxiv_id": "1512.03385",
        "pdf_storage_path": "papers/1512.03385.pdf",
        "pdf_public_url": "https://arxiv.org/pdf/1512.03385.pdf",
        "status": "ready",
        "sections": [],
        "figures": [],
    },
}

def _load_demo_timed_episode() -> dict[str, Any]:
    from pathlib import Path

    fixture = (
        Path(__file__).parent.parent.parent / "tests" / "fixtures" / "sample_timed_episode.json"
    )
    if fixture.exists():
        try:
            with open(fixture, encoding="utf-8") as f:
                import json

                return json.load(f)
        except Exception:
            pass
    return {"duration_seconds": 66, "segments": []}


_demo_data = _load_demo_timed_episode()

_local_episodes_db: dict[str, dict[str, Any]] = {
    "demo-episode-1706": {
        "id": "demo-episode-1706",
        "paper_id": "paper-attention-1706",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "episode_title": "Attention Is All You Need: The Transformer Revolution",
        "summary": "Alex and Dr. Taylor break down the self-attention architecture and why ditching recurrence changed AI forever.",
        "depth_type": "executive_brief",
        "duration_seconds": _demo_data.get("duration_seconds", 66),
        "audio_storage_path": "audio/demo-episode-1706.mp3",
        "audio_url": "http://localhost:8000/api/v1/papers/episodes/demo-episode-1706/stream",
        "status": "ready",
        "segments": _demo_data.get("segments", []),
    }
}

_local_audio_cache: dict[str, bytes] = {}


async def _process_and_generate_pipeline(
    paper_id: str,
    user_id: str,
    parsed_data: dict[str, Any],
    pdf_bytes: bytes,
    source_type: PaperSourceType,
    source_url: str | None = None,
    depth_type: EpisodeDepthType = EpisodeDepthType.EXECUTIVE_BRIEF,
) -> dict[str, Any]:
    """Coordinates PDF upload to Supabase, DB record creation, Gemini script generation, and Edge-TTS synthesis."""
    settings = get_settings()

    # 1. Upload PDF to Storage
    pdf_storage_path = f"papers/{paper_id}.pdf"
    try:
        upload_storage_file(
            bucket=settings.STORAGE_BUCKET_PAPERS,
            path=pdf_storage_path,
            file_bytes=pdf_bytes,
            content_type="application/pdf",
        )
        pdf_public_url = get_storage_public_url(settings.STORAGE_BUCKET_PAPERS, pdf_storage_path)
    except Exception as e:
        logger.warning(f"Storage upload skipped/fallback: {e}")
        pdf_public_url = f"https://storage.paperpod.ai/{pdf_storage_path}"

    # 2. Extract Figures from PDF
    figures_list = parsed_data.get("figures", [])
    if pdf_bytes:
        try:
            from src.services.figure_extractor import extract_and_crop_paper_figures
            extracted_figs = extract_and_crop_paper_figures(pdf_bytes, paper_id=paper_id)
            if extracted_figs:
                figures_list = [f.model_dump() for f in extracted_figs]
        except Exception as e:
            logger.warning(f"Figure extraction pipeline warning: {e}")

    # 3. Build Paper Record
    paper_record = {
        "id": paper_id,
        "user_id": user_id,
        "title": parsed_data.get("title", "Untitled Research Paper"),
        "authors": parsed_data.get("authors", []),
        "abstract": parsed_data.get("abstract", ""),
        "total_pages": parsed_data.get("total_pages", 1),
        "source_type": source_type.value,
        "source_url": source_url or parsed_data.get("source_url"),
        "arxiv_id": parsed_data.get("arxiv_id"),
        "pdf_storage_path": pdf_storage_path,
        "pdf_public_url": pdf_public_url,
        "status": PaperStatus.READY.value,
        "sections": parsed_data.get("sections", []),
        "figures": figures_list,
    }

    # Save to local cache
    _local_papers_db[paper_id] = paper_record

    # 4. Generate 2-Host Script via Gemini
    script_output = await generate_podcast_script(parsed_data, depth_type=depth_type.value)

    # 5. Synthesize Dual-Voice Audio via Edge-TTS
    raw_segments = [s.model_dump() for s in script_output.segments]
    audio_bytes, timed_segments, duration_seconds = await synthesize_full_episode(raw_segments)

    # 6. Synchronize Dialogue Turns with Figures
    from src.services.timeline_service import build_synchronized_timeline
    episode_id = str(uuid.uuid4())
    audio_url = f"http://localhost:{settings.PORT}/api/v1/papers/episodes/{episode_id}/stream"

    timeline_data = build_synchronized_timeline(
        episode_id=episode_id,
        paper_id=paper_id,
        audio_url=audio_url,
        duration_seconds=duration_seconds,
        raw_segments=timed_segments,
        figures=figures_list,
    )

    # 7. Upload Master MP3 Audio to Storage & Cache
    _local_audio_cache[episode_id] = audio_bytes

    audio_storage_path = f"audio/{episode_id}.mp3"
    try:
        upload_storage_file(
            bucket=settings.STORAGE_BUCKET_AUDIO,
            path=audio_storage_path,
            file_bytes=audio_bytes,
            content_type="audio/mpeg",
        )
    except Exception as e:
        logger.warning(f"Audio storage upload fallback: {e}")

    # 8. Build Episode Record
    episode_record = {
        "id": episode_id,
        "paper_id": paper_id,
        "user_id": user_id,
        "episode_title": script_output.episode_title,
        "summary": script_output.summary,
        "depth_type": depth_type.value,
        "duration_seconds": duration_seconds,
        "audio_storage_path": audio_storage_path,
        "audio_url": audio_url,
        "status": EpisodeStatus.READY.value,
        "segments": timeline_data["segments"],
    }

    _local_episodes_db[episode_id] = episode_record

    return {
        "paper": paper_record,
        "episode": episode_record,
    }


@router.post("/arxiv", status_code=status.HTTP_200_OK)
async def ingest_arxiv_paper(payload: ArxivIngestRequest) -> dict[str, Any]:
    """Fetches, parses, and synthesizes a dual-host briefing for an arXiv paper."""
    try:
        logger.info(f"Ingesting arXiv paper: {payload.arxiv_url_or_id}")
        parsed_data = await fetch_arxiv_paper(payload.arxiv_url_or_id)
        pdf_bytes = parsed_data.pop("pdf_bytes", b"")

        paper_id = str(uuid.uuid4())
        user_id = payload.user_id or "00000000-0000-0000-0000-000000000001"

        result = await _process_and_generate_pipeline(
            paper_id=paper_id,
            user_id=user_id,
            parsed_data=parsed_data,
            pdf_bytes=pdf_bytes,
            source_type=PaperSourceType.ARXIV_URL,
            source_url=payload.arxiv_url_or_id,
        )

        return {
            "status": "success",
            "message": "arXiv paper ingested and briefing synthesized successfully",
            "paper_id": paper_id,
            "episode_id": result["episode"]["id"],
            "paper": result["paper"],
            "episode": result["episode"],
        }
    except Exception as e:
        logger.error(f"Error in ingest_arxiv_paper: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest arXiv paper: {str(e)}",
        ) from e


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pdf_paper(
    file: UploadFile = File(...),
    user_id: str = Form("00000000-0000-0000-0000-000000000001"),
) -> dict[str, Any]:
    """Uploads a PDF file, extracts sections/figures, and synthesizes 2-host audio briefing."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid PDF document.",
        )

    try:
        pdf_bytes = await file.read()
        parsed_data = parse_pdf_document(pdf_bytes)

        paper_id = str(uuid.uuid4())

        result = await _process_and_generate_pipeline(
            paper_id=paper_id,
            user_id=user_id,
            parsed_data=parsed_data,
            pdf_bytes=pdf_bytes,
            source_type=PaperSourceType.PDF_UPLOAD,
        )

        return {
            "status": "success",
            "message": "PDF uploaded and briefing synthesized successfully",
            "id": paper_id,
            "paper_id": paper_id,
            "episode_id": result["episode"]["id"],
            "paper": result["paper"],
            "episode": result["episode"],
        }
    except Exception as e:
        logger.error(f"Error in upload_pdf_paper: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF upload: {str(e)}",
        ) from e


@router.get("", status_code=status.HTTP_200_OK)
async def list_papers() -> list[dict[str, Any]]:
    """Returns library list of ingested research papers."""
    return list(_local_papers_db.values())


@router.get("/{paper_id}", status_code=status.HTTP_200_OK)
async def get_paper(paper_id: str) -> dict[str, Any]:
    """Returns paper details and its associated episodes."""
    paper = _local_papers_db.get(paper_id)
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paper with ID '{paper_id}' not found.",
        )
    episodes = [ep for ep in _local_episodes_db.values() if ep.get("paper_id") == paper_id]
    return {
        "paper": paper,
        "episodes": episodes,
    }


@router.get("/episodes/{episode_id}", status_code=status.HTTP_200_OK)
async def get_episode(episode_id: str) -> dict[str, Any]:
    """Returns episode details with synchronized transcript segments."""
    episode = _local_episodes_db.get(episode_id)
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Episode with ID '{episode_id}' not found.",
        )
    return episode


@router.get("/episodes/{episode_id}/stream", status_code=status.HTTP_200_OK)
async def stream_episode_audio(episode_id: str) -> Any:
    """Streams synthesized MP3 audio for an episode directly to client player."""
    from fastapi import Response

    audio_bytes = _local_audio_cache.get(episode_id)
    if not audio_bytes:
        episode = _local_episodes_db.get(episode_id)
        if not episode:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audio for episode '{episode_id}' not found.",
            )

        # Synthesize on demand with Edge-TTS
        try:
            raw_segs = episode.get("segments", [])
            audio_bytes, timed_segs, dur_sec = await synthesize_full_episode(raw_segs)
            _local_audio_cache[episode_id] = audio_bytes
            episode["segments"] = timed_segs
            episode["duration_seconds"] = dur_sec
        except Exception as e:
            logger.error(f"On-demand synthesis failed: {e}")
            audio_bytes = b""

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(len(audio_bytes)),
            "Content-Disposition": f"inline; filename={episode_id}.mp3",
            "Cache-Control": "public, max-age=86400",
        },
    )

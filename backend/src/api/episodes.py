"""Episodes and synchronized timeline API router."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

from src.api.papers import _local_episodes_db, _local_papers_db
from src.services.timeline_service import build_synchronized_timeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/episodes", tags=["Episodes & Timeline"])


@router.get("/{episode_id}/timeline", status_code=status.HTTP_200_OK)
async def get_episode_timeline(episode_id: str) -> dict[str, Any]:
    """Retrieves synchronized transcript segments and figure timestamp triggers for an episode."""
    episode = _local_episodes_db.get(episode_id)
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Episode with ID '{episode_id}' not found.",
        )

    paper_id = episode.get("paper_id", "")
    paper = _local_papers_db.get(paper_id, {})
    figures = paper.get("figures", [])

    # If demo episode and no figures attached to paper, add default Figure 1
    if not figures and episode_id == "demo-episode-1706":
        figures = [
            {
                "id": "fig-transformer-001",
                "paper_id": "paper-attention-1706",
                "figure_number": "Figure 1",
                "caption": "Figure 1: The Transformer - model architecture with Scaled Dot-Product & Multi-Head Attention.",
                "storage_path": "figures/1706.03762_figure_1.png",
                "public_url": "https://storage.paperpod.ai/figures/1706.03762_figure_1.png",
                "page_number": 3,
                "bounding_box": {"x0": 50.0, "y0": 100.0, "x1": 500.0, "y1": 450.0},
                "aspect_ratio": 1.15,
            }
        ]

    timeline = build_synchronized_timeline(
        episode_id=episode_id,
        paper_id=paper_id,
        audio_url=episode.get("audio_url", f"http://localhost:8000/api/v1/papers/episodes/{episode_id}/stream"),
        duration_seconds=episode.get("duration_seconds", 66),
        raw_segments=episode.get("segments", []),
        figures=figures,
    )

    return timeline


@router.get("/{episode_id}", status_code=status.HTTP_200_OK)
async def get_episode_by_id(episode_id: str) -> dict[str, Any]:
    """Returns episode metadata and status."""
    episode = _local_episodes_db.get(episode_id)
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Episode with ID '{episode_id}' not found.",
        )
    return episode

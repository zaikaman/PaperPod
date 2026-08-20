"""Episode Timeline & Visual HUD Synchronization Service."""

import logging
import re
from typing import Any

from src.models.schemas import DialogueSegmentSchema, PaperFigureSchema, SpeakerRole

logger = logging.getLogger(__name__)

# Regex pattern for identifying figure references in dialogue turns
FIGURE_REF_PATTERN = re.compile(
    r"\b(?:Figure|Fig\.|Table)\s*(\d+)\b",
    re.IGNORECASE,
)


def extract_figure_reference_from_text(text: str) -> str | None:
    """Extracts normalized figure reference (e.g. 'Figure 1', 'Table 2') from spoken dialogue."""
    match = FIGURE_REF_PATTERN.search(text)
    if match:
        fig_num = match.group(1)
        prefix = "Table" if "table" in match.group(0).lower() else "Figure"
        return f"{prefix} {fig_num}"
    return None


def match_figure_to_segment(
    segment_text: str,
    figures: list[dict[str, Any] | PaperFigureSchema],
) -> tuple[str | None, dict[str, Any] | None]:
    """Matches a dialogue text to a paper figure, returning (referenced_figure_id, figure_dict)."""
    fig_ref = extract_figure_reference_from_text(segment_text)
    if not fig_ref or not figures:
        return None, None

    normalized_ref = fig_ref.lower().replace(".", "").replace(" ", "")

    for fig in figures:
        fig_dict = fig.model_dump() if isinstance(fig, PaperFigureSchema) else fig
        fig_num = str(fig_dict.get("figure_number", "")).lower().replace(".", "").replace(" ", "")

        if normalized_ref == fig_num or normalized_ref in fig_num:
            return fig_dict.get("id") or fig_dict.get("figure_number"), fig_dict

    # Fallback: if "figure" or "architecture" or "diagram" is mentioned and Figure 1 exists
    if any(k in segment_text.lower() for k in ["figure", "architecture", "diagram", "schematic"]):
        first_fig = figures[0]
        first_dict = first_fig.model_dump() if isinstance(first_fig, PaperFigureSchema) else first_fig
        return first_dict.get("id") or first_dict.get("figure_number"), first_dict

    return None, None


def build_synchronized_timeline(
    episode_id: str,
    paper_id: str,
    audio_url: str,
    duration_seconds: int,
    raw_segments: list[dict[str, Any]],
    figures: list[dict[str, Any] | PaperFigureSchema],
) -> dict[str, Any]:
    """Generates millisecond-accurate timeline mapping dialogue segments to visual figures."""
    processed_segments: list[dict[str, Any]] = []

    for idx, seg in enumerate(raw_segments):
        speaker_val = seg.get("speaker", "alex").lower()
        if speaker_val not in ("alex", "taylor"):
            speaker_val = "alex"

        dialogue_text = seg.get("dialogue_text", "")
        audio_start_ms = int(seg.get("audio_start_ms", idx * 5000))
        audio_end_ms = int(seg.get("audio_end_ms", (idx + 1) * 5000))

        # Check existing referenced_figure_id or detect from text
        ref_fig_id = seg.get("referenced_figure_id")
        ref_fig_data = seg.get("referenced_figure")

        if not ref_fig_id:
            matched_id, matched_fig = match_figure_to_segment(dialogue_text, figures)
            if matched_id:
                ref_fig_id = matched_id
                ref_fig_data = matched_fig

        seg_dict: dict[str, Any] = {
            "id": seg.get("id") or f"seg-{episode_id}-{idx + 1}",
            "episode_id": episode_id,
            "sequence_index": seg.get("sequence_index", idx + 1),
            "speaker": speaker_val,
            "dialogue_text": dialogue_text,
            "audio_start_ms": audio_start_ms,
            "audio_end_ms": audio_end_ms,
            "referenced_figure_id": ref_fig_id,
            "referenced_figure": ref_fig_data,
            "words": seg.get("words", []),
        }
        processed_segments.append(seg_dict)

    # Normalize figures list to plain dicts
    serialized_figures: list[dict[str, Any]] = [
        f.model_dump() if isinstance(f, PaperFigureSchema) else f for f in figures
    ]

    return {
        "episode_id": episode_id,
        "paper_id": paper_id,
        "audio_url": audio_url,
        "duration_seconds": duration_seconds,
        "total_duration_ms": duration_seconds * 1000,
        "segments": processed_segments,
        "figures": serialized_figures,
    }

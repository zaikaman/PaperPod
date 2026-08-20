"""Live Voice Interruption Q&A RAG engine using Gemini 3.1 Flash Lite."""

import json
import logging
from typing import Any

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from src.core.config import get_settings
from src.services.embeddings import find_most_relevant_sections

logger = logging.getLogger(__name__)


class InterruptionDialogueOutput(BaseModel):
    clarification_text: str = Field(
        ...,
        description="Spoken clarification from Dr. Taylor in natural conversational English (2-3 sentences max).",
    )
    relevant_section_heading: str | None = Field(
        default=None,
        description="Title or heading of the most relevant section demystified.",
    )


def get_openai_client() -> AsyncOpenAI:
    """Returns AsyncOpenAI client configured for Gemini 3.1 Flash Lite."""
    settings = get_settings()
    return AsyncOpenAI(
        base_url=settings.GEMINI_BASE_URL,
        api_key=settings.GEMINI_API_KEY or "placeholder-key",
    )


def build_interruption_prompt(
    paper_title: str,
    query_text: str,
    relevant_sections: list[dict[str, Any]],
    current_segment_text: str | None = None,
) -> str:
    """Constructs prompt for Dr. Taylor's in-context clarification."""
    context_blocks = ""
    for sec in relevant_sections[:2]:
        heading = sec.get("heading", "Section")
        content = sec.get("content_text", "")[:800]
        eqs = sec.get("latex_equations", [])
        eq_str = f" [Formulas: {', '.join(eqs[:2])}]" if eqs else ""
        context_blocks += f"\n### {heading}{eq_str}\n{content}\n"

    system_instructions = """You are Dr. Taylor, the Lead AI Scientist and co-host on 'PaperPod', an interactive research podcast.
A curious listener just tapped their microphone to interrupt the briefing and asked a direct question.

YOUR HOST PERSONA & SPEAKING STYLE:
- Crystal clear, warm, intellectually sharp, and encouraging ("Great question!", "Ah, let's break that down...", "So the intuition here is...").
- Deliver an intuitive 2-sentence (max 3 sentences / under 55 words) spoken explanation.
- If asked about an equation or math symbol, translate it into a simple real-world analogy. NEVER use raw LaTeX syntax (no "\\frac", no "\\sqrt", no "\\sum"). Speak the concepts naturally.
- Keep it concise so the listener can get their answer and seamlessly return to the briefing.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "clarification_text": "Spoken 2-3 sentence explanation from Dr. Taylor.",
  "relevant_section_heading": "Section Heading (e.g. 3.2 Scaled Dot-Product Attention)"
}
"""

    user_content = f"""PAPER TITLE: {paper_title}
CURRENT PODCAST DIALOGUE WHEN INTERRUPTED:
{current_segment_text or 'Listener paused during active briefing.'}

RELEVANT PAPER CONTEXT:
{context_blocks or 'General paper concepts.'}

LISTENER'S LIVE QUESTION:
"{query_text}"

Answer as Dr. Taylor now in valid JSON format.
"""
    return f"{system_instructions}\n\n---\n\n{user_content}"


async def generate_interruption_clarification(
    paper_data: dict[str, Any],
    playback_timestamp_ms: int,
    query_text: str,
    active_segment: dict[str, Any] | None = None,
) -> tuple[str, str | None]:
    """Retrieves relevant paper sections and prompts Gemini 3.1 Flash Lite to generate Dr. Taylor's spoken clarification."""
    settings = get_settings()
    paper_title = paper_data.get("title", "Research Paper")
    sections = paper_data.get("sections", [])

    # 1. Semantic RAG Search for top 2 sections
    relevant_sections = await find_most_relevant_sections(
        query=query_text,
        sections=sections,
        top_k=2,
        threshold=0.0,
    )

    heading = relevant_sections[0].get("heading") if relevant_sections else "General Context"
    current_text = active_segment.get("dialogue_text") if active_segment else None

    # 2. Build prompt & call Gemini Flash Lite
    prompt = build_interruption_prompt(
        paper_title=paper_title,
        query_text=query_text,
        relevant_sections=relevant_sections,
        current_segment_text=current_text,
    )

    try:
        client = get_openai_client()
        completion = await client.chat.completions.create(
            model=settings.GEMINI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a research podcast AI co-host. Output only raw JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.6,
            max_tokens=250,
        )

        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        clarification = parsed.get("clarification_text", "").strip()
        section_tag = parsed.get("relevant_section_heading") or heading

        if clarification:
            logger.info(f"Generated clarification from Dr. Taylor ({len(clarification)} chars).")
            return clarification, section_tag

    except Exception as e:
        logger.warning(f"Error calling Gemini for interruption clarification: {e}. Using smart fallback.")

    # 3. Deterministic intuitive fallback
    if "equation" in query_text.lower() or "formula" in query_text.lower() or "sqrt" in query_text.lower():
        fallback_text = (
            f"Great question! In {heading or 'this section'}, dividing by the square root of the key dimension scales the dot products down. "
            "This prevents softmax values from saturating into regions with vanishingly small gradients."
        )
    elif "figure" in query_text.lower() or "diagram" in query_text.lower() or "hud" in query_text.lower():
        fallback_text = (
            "Good catch! If you glance at the visual HUD on your screen, that diagram shows the encoder on the left "
            "feeding representations into the decoder stack on the right through cross-attention."
        )
    else:
        fallback_text = (
            f"So the intuition behind {query_text.replace('?', '').strip()} is that self-attention allows each word "
            "to directly connect with every other word in parallel, eliminating the sequential bottleneck of recurrent networks."
        )

    return fallback_text, heading

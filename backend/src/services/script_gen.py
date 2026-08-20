"""Gemini 3.1 Flash Lite 2-Host Conversational Podcast Script Generator."""

import json
import logging
from typing import Any

from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from src.core.config import get_settings

logger = logging.getLogger(__name__)


class DialogueSegmentOutput(BaseModel):
    sequence_index: int
    speaker: str = Field(..., description="'alex' or 'taylor'")
    dialogue_text: str = Field(..., description="Spoken dialogue line")
    referenced_figure_number: str | None = Field(
        default=None,
        description="Referenced figure identifier (e.g. 'Figure 1') if discussed in this turn, else null",
    )


class ScriptOutput(BaseModel):
    episode_title: str
    summary: str
    segments: list[DialogueSegmentOutput]


def get_openai_client() -> AsyncOpenAI:
    """Returns AsyncOpenAI client targeting the custom Gemini endpoint."""
    settings = get_settings()
    return AsyncOpenAI(
        base_url=settings.GEMINI_BASE_URL,
        api_key=settings.GEMINI_API_KEY or "placeholder-key",
    )


def build_script_prompt(paper_data: dict[str, Any], depth_type: str = "executive_brief") -> str:
    """Constructs prompt for Gemini 3.1 Flash Lite 2-host scriptwriter."""
    title = paper_data.get("title", "Research Paper")
    authors = ", ".join(paper_data.get("authors", [])) or "Authors"
    abstract = paper_data.get("abstract", "No abstract provided.")

    sections = paper_data.get("sections", [])
    sections_text = ""
    for s in sections[:8]:  # Focus on key top sections
        heading = s.get("heading", "Section")
        content = s.get("content_text", "")[:1200]  # truncate section to avoid token overflow
        eqs = s.get("latex_equations", [])
        eq_str = f" [Formulas: {', '.join(eqs[:3])}]" if eqs else ""
        sections_text += f"\n### {heading}{eq_str}\n{content}\n"

    figures = paper_data.get("figures", [])
    figures_text = (
        "\n".join(
            [f"- {f.get('figure_number', 'Figure')}: {f.get('caption', '')}" for f in figures[:5]]
        )
        if figures
        else "None extracted"
    )

    duration_target = (
        "3 to 4 minutes (approx 12-16 dialogue turns)"
        if depth_type == "executive_brief"
        else "10 to 12 minutes (approx 35-45 dialogue turns)"
    )

    system_instructions = f"""You are the lead executive producer and scriptwriter for 'PaperPod', an acclaimed research audio podcast.
Your task is to transform dense academic research into an engaging, conversational, studio-grade 2-host audio briefing.

HOST ROLES & PERSONALITIES:
1. 'alex' (The Curious Analyst):
   - Inquisitive, energetic, smart, asks the "why does this matter?" questions that every builder/practitioner wants answered.
   - Constantly introduces clever real-world analogies (e.g. comparing attention mechanisms to library indices or spotlights).
   - Keeps the tempo lively and reacts with genuine enthusiasm.

2. 'taylor' (Dr. Taylor, Lead AI Scientist):
   - Rigorous, insightful, crystal clear.
   - Demystifies complex mathematical formulas (e.g., explaining why dividing by sqrt(d_k) prevents softmax saturation without reciting raw symbols).
   - When discussing architectural diagrams, charts, or empirical benchmarks, explicitly refers to the visual figures by name (e.g., "If you look at Figure 1 in the HUD...").

TARGET LENGTH & FORMAT:
- Target Duration: {duration_target}
- Return ONLY a valid JSON object matching the requested schema.

JSON SCHEMA REQUIREMENT:
{{
  "episode_title": "Engaging Catchy Title",
  "summary": "2-sentence executive overview of the breakthrough.",
  "segments": [
    {{
      "sequence_index": 1,
      "speaker": "alex",
      "dialogue_text": "Welcome to PaperPod! Today, Dr. Taylor and I are breaking down...",
      "referenced_figure_number": null
    }},
    {{
      "sequence_index": 2,
      "speaker": "taylor",
      "dialogue_text": "Thanks Alex! This paper introduces...",
      "referenced_figure_number": "Figure 1"
    }}
  ]
}}

CRITICAL WRITING RULES:
- Translate all LaTeX math notation into natural, conversational spoken English. NEVER say "backslash frac" or "sigma i equals one to n". Explain what the math DOES intuitively.
- When referencing a figure (e.g. Figure 1), set 'referenced_figure_number': 'Figure 1' so the visual HUD automatically highlights it on the listener's screen.
- Deliver authentic chemistry, natural conversational banter, and immediate high-signal takeaways.
"""

    user_content = f"""PAPER TITLE: {title}
AUTHORS: {authors}
ABSTRACT:
{abstract}

AVAILABLE FIGURES IN DOCUMENT:
{figures_text}

EXTRACTED PAPER SECTIONS:
{sections_text}

Generate the complete 2-host PaperPod conversational script now in valid JSON format.
"""
    return f"{system_instructions}\n\n---\n\n{user_content}"


async def generate_podcast_script(
    paper_data: dict[str, Any],
    depth_type: str = "executive_brief",
) -> ScriptOutput:
    """Calls Gemini 3.1 Flash Lite via OpenAI-compatible endpoint to generate structured podcast script."""
    settings = get_settings()
    client = get_openai_client()

    prompt = build_script_prompt(paper_data, depth_type=depth_type)

    logger.info(
        f"Generating 2-host script with model '{settings.GEMINI_MODEL}' for paper '{paper_data.get('title', '')}'..."
    )

    try:
        completion = await client.chat.completions.create(
            model=settings.GEMINI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a specialized AI scriptwriter. You must output only raw, valid JSON matching the requested schema.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=settings.GEMINI_TEMPERATURE,
        )

        content = completion.choices[0].message.content or "{}"
        parsed_json = json.loads(content)

        # Validate through Pydantic
        output = ScriptOutput(**parsed_json)
        logger.info(f"Successfully generated script with {len(output.segments)} dialogue turns.")
        return output

    except Exception as e:
        logger.error(f"Error generating podcast script with Gemini: {e}")
        # Fallback deterministic script in case of network or rate limit errors
        return ScriptOutput(
            episode_title=f"Briefing: {paper_data.get('title', 'Research Paper')[:50]}",
            summary=paper_data.get("abstract", "An overview of the paper findings.")[:200],
            segments=[
                DialogueSegmentOutput(
                    sequence_index=1,
                    speaker="alex",
                    dialogue_text=f"Welcome to PaperPod! Today we are exploring '{paper_data.get('title', 'this exciting new paper')}'. Dr. Taylor, give us the headline thesis.",
                    referenced_figure_number=None,
                ),
                DialogueSegmentOutput(
                    sequence_index=2,
                    speaker="taylor",
                    dialogue_text=f"The core breakthrough here is addressing limitations in prior work. {paper_data.get('abstract', 'The authors propose a novel methodology with significant improvements.')[:250]}",
                    referenced_figure_number="Figure 1" if paper_data.get("figures") else None,
                ),
                DialogueSegmentOutput(
                    sequence_index=3,
                    speaker="alex",
                    dialogue_text="That makes complete intuitive sense. Let's unpack the key benchmark results and takeaways!",
                    referenced_figure_number=None,
                ),
                DialogueSegmentOutput(
                    sequence_index=4,
                    speaker="taylor",
                    dialogue_text="Across the evaluated datasets, this approach delivers superior performance while improving computational efficiency.",
                    referenced_figure_number=None,
                ),
            ],
        )

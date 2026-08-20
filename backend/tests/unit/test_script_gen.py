"""Unit tests for Gemini 3.1 Flash Lite 2-host script generation."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.script_gen import ScriptOutput, build_script_prompt, generate_podcast_script


@pytest.fixture
def sample_paper_data() -> dict:
    return {
        "title": "Attention Is All You Need",
        "authors": ["Ashish Vaswani", "Noam Shazeer"],
        "abstract": "We propose the Transformer model based on self-attention.",
        "sections": [
            {
                "section_index": 1,
                "heading": "1. Introduction",
                "content_text": "Recurrent neural networks have limitations with sequential computations.",
                "latex_equations": [],
            },
            {
                "section_index": 2,
                "heading": "3. Model Architecture",
                "content_text": "The Transformer uses scaled dot-product attention.",
                "latex_equations": ["Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V"],
            },
        ],
        "figures": [
            {
                "figure_number": "Figure 1",
                "caption": "Figure 1: The Transformer model architecture.",
                "page_number": 1,
            }
        ],
    }


def test_build_script_prompt(sample_paper_data: dict) -> None:
    prompt = build_script_prompt(sample_paper_data, depth_type="executive_brief")
    assert "Attention Is All You Need" in prompt
    assert "Alex" in prompt
    assert "Dr. Taylor" in prompt
    assert "Figure 1" in prompt


@pytest.mark.asyncio
async def test_generate_podcast_script_mocked(sample_paper_data: dict) -> None:
    mock_response_json = {
        "episode_title": "The Transformer Revolution",
        "summary": "Deep dive into self-attention with Alex and Dr. Taylor.",
        "segments": [
            {
                "sequence_index": 1,
                "speaker": "alex",
                "dialogue_text": "Welcome to PaperPod! Dr. Taylor, what makes the Transformer so revolutionary?",
                "referenced_figure_number": None,
            },
            {
                "sequence_index": 2,
                "speaker": "taylor",
                "dialogue_text": "Alex, it completely replaces recurrence with self-attention! Take a look at Figure 1.",
                "referenced_figure_number": "Figure 1",
            },
        ],
    }

    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(mock_response_json)
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    with patch("src.services.script_gen.get_openai_client") as mock_client_factory:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
        mock_client_factory.return_value = mock_client

        result: ScriptOutput = await generate_podcast_script(
            sample_paper_data, depth_type="executive_brief"
        )

        assert result.episode_title == "The Transformer Revolution"
        assert len(result.segments) == 2
        assert result.segments[0].speaker == "alex"
        assert result.segments[1].speaker == "taylor"
        assert result.segments[1].referenced_figure_number == "Figure 1"

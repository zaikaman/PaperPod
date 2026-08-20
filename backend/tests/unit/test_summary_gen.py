"""Unit tests for Gemini 3.1 Flash Lite Summary Card Generator (T057)."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.summary_gen import (
    QuantitativeBenchmark,
    SummaryCardOutput,
    build_summary_prompt,
    generate_summary_card,
)


@pytest.fixture
def sample_paper_data() -> dict:
    return {
        "title": "Attention Is All You Need",
        "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
        "abstract": "We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.",
        "sections": [
            {
                "section_index": 1,
                "heading": "1. Introduction",
                "content_text": "Recurrent models generate sequences step-by-step, precluding parallelization within training examples.",
                "latex_equations": [],
            },
            {
                "section_index": 2,
                "heading": "6. Results",
                "content_text": "On the WMT 2014 English-to-German translation task, the big transformer model achieves 28.4 BLEU, outperforming the best existing models including ensembles by over 2.0 BLEU.",
                "latex_equations": [],
            },
            {
                "section_index": 3,
                "heading": "7. Conclusion and Future Work",
                "content_text": "We plan to extend the Transformer to problems involving input and output modalities other than text and investigate local, restricted attention mechanisms for very large inputs.",
                "latex_equations": [],
            },
        ],
        "figures": [
            {
                "figure_number": "Figure 1",
                "caption": "Figure 1: The Transformer - model architecture.",
                "page_number": 3,
            }
        ],
    }


def test_build_summary_prompt(sample_paper_data: dict) -> None:
    prompt = build_summary_prompt(sample_paper_data)
    assert "Attention Is All You Need" in prompt
    assert "Ashish Vaswani" in prompt
    assert "quantitative_results" in prompt
    assert "core_thesis" in prompt
    assert "limitations" in prompt
    assert "future_work" in prompt


@pytest.mark.asyncio
async def test_generate_summary_card_mocked(sample_paper_data: dict) -> None:
    mock_response_json = {
        "core_thesis": "The Transformer replaces recurrent and convolutional architectures with a pure self-attention mechanism, enabling massive parallelization and state-of-the-art translation performance.",
        "quantitative_results": [
            {
                "metric": "WMT 2014 EN-DE Translation (BLEU)",
                "baseline": "26.3 BLEU (ByteNet/ConvS2S)",
                "paper_result": "28.4 BLEU",
                "improvement": "+2.1 BLEU (New SOTA)",
            },
            {
                "metric": "Training Cost (FLOPs)",
                "baseline": "1.0e20 FLOPs (ConvS2S)",
                "paper_result": "3.3e18 FLOPs",
                "improvement": "30x more compute-efficient",
            },
        ],
        "limitations": [
            "Quadratic memory complexity O(n^2) with sequence length n.",
            "Requires explicit positional encodings due to lack of recurrent sequence awareness.",
        ],
        "future_work": [
            "Extend self-attention to multimodal tasks like images and audio.",
            "Develop linear-time attention approximations for long contexts.",
        ],
    }

    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(mock_response_json)
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    with patch("src.services.summary_gen.get_openai_client") as mock_client_factory:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
        mock_client_factory.return_value = mock_client

        result: SummaryCardOutput = await generate_summary_card(sample_paper_data)

        assert isinstance(result, SummaryCardOutput)
        assert "Transformer replaces recurrent" in result.core_thesis
        assert len(result.quantitative_results) == 2
        assert result.quantitative_results[0].metric == "WMT 2014 EN-DE Translation (BLEU)"
        assert result.quantitative_results[0].paper_result == "28.4 BLEU"
        assert len(result.limitations) == 2
        assert len(result.future_work) == 2


@pytest.mark.asyncio
async def test_generate_summary_card_fallback_on_error(sample_paper_data: dict) -> None:
    """Verify fallback summary generation works reliably when LLM client throws an exception."""
    with patch("src.services.summary_gen.get_openai_client") as mock_client_factory:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=Exception("Rate limit exceeded"))
        mock_client_factory.return_value = mock_client

        result: SummaryCardOutput = await generate_summary_card(sample_paper_data)

        assert isinstance(result, SummaryCardOutput)
        assert len(result.core_thesis) > 0
        assert len(result.quantitative_results) >= 1
        assert len(result.limitations) >= 1
        assert len(result.future_work) >= 1


def test_quantitative_benchmark_validation() -> None:
    bench = QuantitativeBenchmark(
        metric="Accuracy",
        baseline="85.2%",
        paper_result="92.1%",
        improvement="+6.9%",
    )
    assert bench.metric == "Accuracy"
    assert bench.improvement == "+6.9%"

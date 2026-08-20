"""Unit tests for section vector embeddings and similarity search in test_rag.py."""

import pytest

from src.services.embeddings import (
    cosine_similarity,
    embed_paper_sections,
    find_most_relevant_sections,
    generate_deterministic_embedding,
    generate_text_embedding,
)


def test_cosine_similarity_edge_cases() -> None:
    """Verifies cosine similarity handles identical, orthogonal, opposite, and zero vectors."""
    # Identical vectors
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v2), 0.001) == 1.0

    # Orthogonal vectors
    v3 = [0.0, 1.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v3), 0.001) == 0.0

    # Opposite vectors
    v4 = [-1.0, 0.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v4), 0.001) == -1.0

    # Zero vector
    v_zero = [0.0, 0.0, 0.0]
    assert cosine_similarity(v1, v_zero) == 0.0

    # Mismatched dimensions
    assert cosine_similarity([1.0, 2.0], [1.0, 2.0, 3.0]) == 0.0


@pytest.mark.asyncio
async def test_generate_text_embedding_format() -> None:
    """Verifies that generated embeddings return 1536-dimensional normalized vectors."""
    embedding = await generate_text_embedding("Attention Is All You Need self-attention mechanism")
    assert isinstance(embedding, list)
    assert len(embedding) == 1536
    assert all(isinstance(val, float) for val in embedding)

    # Unit norm check
    norm_sq = sum(x * x for x in embedding)
    assert pytest.approx(norm_sq, 0.01) == 1.0


@pytest.mark.asyncio
async def test_embed_paper_sections_and_search() -> None:
    """Verifies batch embedding and semantic ranking of relevant sections."""
    sections = [
        {
            "id": "sec-1",
            "section_index": 1,
            "heading": "1. Introduction",
            "content_text": "Recurrent neural networks suffer from sequential computation bottlenecks.",
            "latex_equations": [],
        },
        {
            "id": "sec-2",
            "section_index": 2,
            "heading": "3.2 Scaled Dot-Product Attention",
            "content_text": "We compute the attention function on a set of queries simultaneously. The formula divides by the square root of dimension d_k to prevent gradient vanishing in softmax.",
            "latex_equations": ["Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V"],
        },
        {
            "id": "sec-3",
            "section_index": 3,
            "heading": "5. Training Regime",
            "content_text": "We trained on standard WMT 2014 English-to-German dataset with 8 NVIDIA P100 GPUs.",
            "latex_equations": [],
        },
    ]

    enriched = await embed_paper_sections(sections)
    assert len(enriched) == 3
    for sec in enriched:
        assert "embedding" in sec
        assert len(sec["embedding"]) == 1536

    # Query specifically about softmax and attention formula
    results = await find_most_relevant_sections(
        query="Why do we divide by square root of d_k in equation for attention softmax?",
        sections=enriched,
        top_k=2,
    )

    assert len(results) <= 2
    # The Scaled Dot-Product Attention section should rank first due to semantic overlap
    assert results[0]["id"] == "sec-2"
    assert "Scaled Dot-Product Attention" in results[0]["heading"]
    assert "similarity_score" in results[0]

"""Paper section vector embeddings and similarity search service for RAG."""

import hashlib
import logging
import math
from typing import Any

from openai import AsyncOpenAI

from src.core.config import get_settings

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 1536


def get_openai_client() -> AsyncOpenAI:
    """Returns AsyncOpenAI client configured for embedding generation."""
    settings = get_settings()
    return AsyncOpenAI(
        base_url=settings.GEMINI_BASE_URL,
        api_key=settings.GEMINI_API_KEY or "placeholder-key",
    )


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculates cosine similarity between two float vectors.

    Returns a value between -1.0 and 1.0 (or 0.0 for zero vectors).
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def generate_deterministic_embedding(text: str, dim: int = EMBEDDING_DIMENSION) -> list[float]:
    """Generates a deterministic, normalized embedding vector from text.

    Used for zero-cost offline development, unit tests, and fallback scenarios.
    """
    cleaned = text.lower().strip()
    words = cleaned.split()
    vector = [0.0] * dim

    if not words:
        vector[0] = 1.0
        return vector

    for word in words:
        # Create deterministic pseudo-random hash indices for each token
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        for i in range(4):
            idx = (h + i * 997) % dim
            val = ((h >> (i * 8)) & 0xFF) / 255.0 - 0.5
            vector[idx] += val

    # Normalize vector to unit length
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    else:
        vector[0] = 1.0

    return vector


async def generate_text_embedding(
    text: str,
    model: str = "text-embedding-3-small",
) -> list[float]:
    """Generates a vector embedding for the input text using API or deterministic fallback."""
    settings = get_settings()

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "placeholder-key":
        return generate_deterministic_embedding(text)

    try:
        client = get_openai_client()
        response = await client.embeddings.create(
            input=text[:4000],
            model=model,
        )
        if response.data and len(response.data) > 0:
            embedding = response.data[0].embedding
            return embedding
    except Exception as e:
        logger.warning(f"Live embedding API call failed: {e}. Using deterministic fallback vector.")

    return generate_deterministic_embedding(text)


async def embed_paper_sections(
    sections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Ensures each paper section has a 1536-dimensional vector embedding."""
    enriched_sections: list[dict[str, Any]] = []

    for section in sections:
        sec_copy = dict(section)
        if not sec_copy.get("embedding"):
            heading = sec_copy.get("heading", "")
            content = sec_copy.get("content_text", "")
            latex = " ".join(sec_copy.get("latex_equations", []))
            combined_text = f"{heading}\n{content}\n{latex}".strip()

            embedding = await generate_text_embedding(combined_text)
            sec_copy["embedding"] = embedding

        enriched_sections.append(sec_copy)

    return enriched_sections


async def find_most_relevant_sections(
    query: str,
    sections: list[dict[str, Any]],
    top_k: int = 3,
    threshold: float = 0.0,
) -> list[dict[str, Any]]:
    """Performs semantic similarity search to find the most relevant paper sections for a query."""
    if not sections:
        return []

    query_embedding = await generate_text_embedding(query)
    scored_sections: list[tuple[float, dict[str, Any]]] = []

    for sec in sections:
        sec_embedding = sec.get("embedding")
        if not sec_embedding:
            # Fallback compute on the fly
            sec_text = f"{sec.get('heading', '')}\n{sec.get('content_text', '')}"
            sec_embedding = generate_deterministic_embedding(sec_text)

        score = cosine_similarity(query_embedding, sec_embedding)
        if score >= threshold:
            scored_sec = dict(sec)
            scored_sec["similarity_score"] = round(score, 4)
            scored_sections.append((score, scored_sec))

    # Sort descending by similarity score
    scored_sections.sort(key=lambda x: x[0], reverse=True)

    return [item[1] for item in scored_sections[:top_k]]

"""Contract tests for Live Voice Interruption & In-Context Clarification API."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.asyncio
async def test_submit_voice_interruption_contract() -> None:
    """Verifies POST /api/v1/episodes/{episode_id}/interrupt returns valid schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "playback_timestamp_ms": 12500,
            "query_text": "Why do we divide by sqrt(d_k) in equation 1?",
            "user_id": "00000000-0000-0000-0000-000000000001",
        }
        response = await client.post(
            "/api/v1/episodes/demo-episode-1706/interrupt",
            json=payload,
        )

        assert response.status_code == 200
        data = response.json()

        assert "interruption_id" in data
        assert "clarification_text" in data
        assert len(data["clarification_text"]) > 10
        assert "audio_url" in data
        assert "duration_ms" in data
        assert data["duration_ms"] > 0
        assert "resume_timestamp_ms" in data
        assert data["resume_timestamp_ms"] == 12500
        assert "latency_ms" in data

        # Check audio stream endpoint if returned URL is local
        interruption_id = data["interruption_id"]
        stream_res = await client.get(f"/api/v1/episodes/interruptions/{interruption_id}/stream")
        assert stream_res.status_code == 200
        assert stream_res.headers["content-type"] == "audio/mpeg"


@pytest.mark.asyncio
async def test_submit_voice_interruption_not_found() -> None:
    """Verifies 404 response for nonexistent episode ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "playback_timestamp_ms": 5000,
            "query_text": "What is self-attention?",
        }
        response = await client.post(
            "/api/v1/episodes/nonexistent-episode-id/interrupt",
            json=payload,
        )
        assert response.status_code == 404

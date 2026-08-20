"""Contract tests for Episode Timeline & HUD Audio Synchronization API."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.asyncio
async def test_get_episode_timeline_contract() -> None:
    """Verifies GET /api/v1/episodes/{episode_id}/timeline matches OpenAPI schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Use seeded demo episode
        response = await client.get("/api/v1/episodes/demo-episode-1706/timeline")
        assert response.status_code == 200

        data = response.json()
        assert "episode_id" in data
        assert data["episode_id"] == "demo-episode-1706"
        assert "audio_url" in data
        assert "duration_seconds" in data
        assert "segments" in data
        assert isinstance(data["segments"], list)

        if len(data["segments"]) > 0:
            segment = data["segments"][0]
            assert "speaker" in segment
            assert segment["speaker"] in ("alex", "taylor")
            assert "dialogue_text" in segment
            assert "audio_start_ms" in segment
            assert "audio_end_ms" in segment
            assert "sequence_index" in segment


@pytest.mark.asyncio
async def test_get_episode_timeline_not_found() -> None:
    """Verifies 404 response for nonexistent episode ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/episodes/nonexistent-episode-uuid/timeline")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

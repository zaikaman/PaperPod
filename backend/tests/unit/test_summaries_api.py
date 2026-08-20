"""Unit and contract tests for Summaries & Audio Bookmarks API Endpoints (T059)."""

from httpx import ASGITransport, AsyncClient
import pytest

from src.main import app


@pytest.mark.asyncio
async def test_get_paper_summary_card_demo() -> None:
    """Verify fetching summary card for demo paper returns complete high-density card."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/papers/paper-attention-1706/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["paper_id"] == "paper-attention-1706"
        assert "Transformer" in data["core_thesis"]
        assert len(data["quantitative_results"]) >= 2
        assert len(data["limitations"]) >= 1
        assert len(data["future_work"]) >= 1


@pytest.mark.asyncio
async def test_generate_paper_summary_card() -> None:
    """Verify POST /api/v1/papers/{id}/summary generates or refreshes summary card."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/papers/paper-resnet-1512/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["paper_id"] == "paper-resnet-1512"
        assert len(data["core_thesis"]) > 0
        assert len(data["quantitative_results"]) >= 1


@pytest.mark.asyncio
async def test_audio_bookmarks_crud_flow() -> None:
    """Verify creating, listing, and deleting audio bookmarks during playback."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create a new bookmark
        create_payload = {
            "user_id": "00000000-0000-0000-0000-000000000001",
            "timestamp_ms": 25400,
            "note_text": "Key insight: Scaled dot-product attention formula.",
        }
        create_res = await client.post(
            "/api/v1/episodes/demo-episode-1706/bookmarks",
            json=create_payload,
        )
        assert create_res.status_code == 201
        created = create_res.json()
        assert created["status"] == "created"
        bookmark = created["bookmark"]
        assert bookmark["timestamp_ms"] == 25400
        assert bookmark["note_text"] == "Key insight: Scaled dot-product attention formula."
        bm_id = bookmark["id"]

        # 2. List bookmarks for episode
        list_res = await client.get("/api/v1/episodes/demo-episode-1706/bookmarks")
        assert list_res.status_code == 200
        bms = list_res.json()
        assert any(b["id"] == bm_id for b in bms)

        # 3. Delete the bookmark
        del_res = await client.delete(f"/api/v1/bookmarks/{bm_id}")
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert del_data["status"] == "deleted"

        # 4. Verify bookmark is deleted
        list_after = await client.get("/api/v1/episodes/demo-episode-1706/bookmarks")
        assert list_after.status_code == 200
        bms_after = list_after.json()
        assert not any(b["id"] == bm_id for b in bms_after)

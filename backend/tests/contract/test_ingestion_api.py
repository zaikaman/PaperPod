"""Contract tests for Paper Ingestion APIs."""

import os

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_paper.pdf")
    with open(path, "rb") as f:
        return f.read()


@pytest.mark.asyncio
async def test_arxiv_ingest_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "arxiv_url_or_id": "1706.03762",
            "user_id": "00000000-0000-0000-0000-000000000001",
        }
        response = await client.post("/api/v1/papers/arxiv", json=payload)
        # Verify status code is 200/202 or structured response
        assert response.status_code in (200, 202)
        data = response.json()
        assert "paper_id" in data or "id" in data
        assert "title" in data or "status" in data


@pytest.mark.asyncio
async def test_pdf_upload_endpoint(sample_pdf_bytes: bytes) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("sample_paper.pdf", sample_pdf_bytes, "application/pdf")}
        data = {"user_id": "00000000-0000-0000-0000-000000000001"}
        response = await client.post("/api/v1/papers/upload", files=files, data=data)
        assert response.status_code in (200, 201, 202)
        res_data = response.json()
        assert "id" in res_data or "paper_id" in res_data

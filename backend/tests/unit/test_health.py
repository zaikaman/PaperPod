"""Unit test for FastAPI healthcheck and application initialization."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import get_settings
from src.main import app


@pytest.mark.asyncio
async def test_healthcheck_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "PaperPod AI Core"


@pytest.mark.asyncio
async def test_root_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "docs_url" in data


def test_settings_defaults() -> None:
    settings = get_settings()
    assert settings.GEMINI_BASE_URL == "https://cheapkeyai.shop/v1"
    assert settings.GEMINI_MODEL == "gemini-3.1-flash-lite"
    assert settings.STORAGE_BUCKET_PAPERS == "papers"

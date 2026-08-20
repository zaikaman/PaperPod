"""PaperPod FastAPI Application Entry Point."""
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("paperpod")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger.info(f"Starting PaperPod Backend Service in '{settings.ENVIRONMENT}' mode...")
    logger.info(f"AI LLM Base URL: {settings.GEMINI_BASE_URL} | Model: {settings.GEMINI_MODEL}")
    yield
    logger.info("Shutting down PaperPod Backend Service...")


settings = get_settings()

app = FastAPI(
    title="PaperPod AI Core API",
    description="Interactive 2-Host AI Audio Research Companion Backend Service",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"], status_code=status.HTTP_200_OK)
async def healthcheck() -> dict[str, str]:
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "ok",
        "service": "PaperPod AI Core",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["System"], status_code=status.HTTP_200_OK)
async def root() -> dict[str, str]:
    """Root endpoint returning API service metadata."""
    return {
        "message": "Welcome to PaperPod AI Core API",
        "docs_url": "/docs",
        "health_url": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )

"""Supabase Client wrapper and storage/database helpers."""

import logging
from typing import Any

from supabase import Client, create_client

from src.core.config import get_settings

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Returns initialized Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if not url or not key:
            logger.warning(
                "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. "
                "Using local fallback client placeholder."
            )
            # Create dummy client for local development / test environments if needed
            url = "https://placeholder-project.supabase.co"
            key = "placeholder-key"

        _supabase_client = create_client(url, key)
    return _supabase_client


def upload_storage_file(
    bucket: str,
    path: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
    upsert: bool = True,
) -> dict[str, Any]:
    """Uploads binary file to specified Supabase Storage bucket."""
    supabase = get_supabase()
    try:
        response = supabase.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true" if upsert else "false",
            },
        )
        return {"status": "success", "path": path, "response": response}
    except Exception as e:
        logger.error(f"Error uploading file to storage bucket '{bucket}' at '{path}': {e}")
        raise e


def get_storage_public_url(bucket: str, path: str) -> str:
    """Generates public CDN URL for a file in Supabase Storage."""
    supabase = get_supabase()
    try:
        res = supabase.storage.from_(bucket).get_public_url(path)
        if isinstance(res, str):
            return res
        return getattr(res, "public_url", str(res))
    except Exception as e:
        logger.error(f"Error resolving public URL for '{bucket}/{path}': {e}")
        return f"{get_settings().SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def match_paper_sections_rag(
    paper_id: str,
    query_embedding: list[float],
    threshold: float = 0.5,
    count: int = 3,
) -> list[dict[str, Any]]:
    """Executes pgvector similarity search RPC for paper sections."""
    supabase = get_supabase()
    try:
        rpc_res = supabase.rpc(
            "match_paper_sections",
            {
                "p_paper_id": paper_id,
                "query_embedding": query_embedding,
                "match_threshold": threshold,
                "match_count": count,
            },
        ).execute()
        return rpc_res.data or []
    except Exception as e:
        logger.error(f"Error executing vector match RPC for paper '{paper_id}': {e}")
        return []

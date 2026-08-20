"""Rapid single-turn neural TTS generation for Dr. Taylor's live clarification answers."""

import logging
from typing import Any

import edge_tts

from src.core.config import get_settings
from src.core.supabase_client import get_storage_public_url, upload_storage_file
from src.services.audio_tts import get_mp3_duration_ms

logger = logging.getLogger(__name__)

# In-memory fast audio cache for live interruption streams
_interruption_audio_cache: dict[str, bytes] = {}


def get_cached_interruption_audio(interruption_id: str) -> bytes | None:
    """Retrieves cached MP3 audio bytes for an interruption ID."""
    return _interruption_audio_cache.get(interruption_id)


def store_cached_interruption_audio(interruption_id: str, audio_bytes: bytes) -> None:
    """Stores MP3 audio bytes in the local in-memory stream cache."""
    _interruption_audio_cache[interruption_id] = audio_bytes


async def synthesize_clarification_audio(
    text: str,
    interruption_id: str,
    voice: str | None = None,
) -> tuple[bytes, int, str]:
    """Rapidly synthesizes Dr. Taylor's spoken clarification using Edge-TTS.

    Returns:
        (audio_bytes, duration_ms, public_or_stream_url)
    """
    settings = get_settings()
    target_voice = voice or settings.TTS_VOICE_INTERRUPTION or "en-US-AriaNeural"

    logger.info(f"Synthesizing live clarification audio ({len(text)} chars) with voice '{target_voice}'...")

    audio_buffer = bytearray()
    try:
        communicate = edge_tts.Communicate(text=text, voice=target_voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])
    except Exception as e:
        logger.warning(f"Edge-TTS clarification synthesis warning: {e}. Generating fallback tone/silence.")
        # Fallback 1-second silence/placeholder
        audio_buffer = bytearray(b"\xFF\xFB\x90\x64\x00\x00\x00\x00" * 40)

    audio_bytes = bytes(audio_buffer)
    duration_ms = get_mp3_duration_ms(audio_bytes)
    if duration_ms <= 0:
        duration_ms = max(1500, int(len(text.split()) / 2.8 * 1000))

    # 1. Cache in memory for instant local playback
    store_cached_interruption_audio(interruption_id, audio_bytes)
    stream_url = f"http://localhost:8000/api/v1/episodes/interruptions/{interruption_id}/stream"

    # 2. Try Supabase storage upload in background/try-catch
    try:
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            storage_path = f"interruptions/{interruption_id}.mp3"
            upload_storage_file(
                bucket=settings.STORAGE_BUCKET_AUDIO,
                path=storage_path,
                file_bytes=audio_bytes,
                content_type="audio/mpeg",
                upsert=True,
            )
            public_url = get_storage_public_url(settings.STORAGE_BUCKET_AUDIO, storage_path)
            if public_url and public_url.startswith("http"):
                stream_url = public_url
    except Exception as e:
        logger.info(f"Using local streaming endpoint for interruption audio: {e}")

    logger.info(f"Clarification audio ready: {duration_ms}ms, stream URL: {stream_url}")
    return audio_bytes, duration_ms, stream_url

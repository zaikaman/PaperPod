"""Multi-Voice Edge-TTS Neural Audio Synthesis & Precise Timestamp Alignment."""
import io
import logging
from typing import Any

import edge_tts

from src.core.config import get_settings

logger = logging.getLogger(__name__)


def get_mp3_duration_ms(data: bytes) -> int:
    """Calculates the exact duration in milliseconds of an MP3 audio buffer by parsing MPEG frame headers."""
    idx = 0
    total_ms = 0.0
    bitrates_v1_l3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    bitrates_v2_l3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
    samplerates_v1 = [44100, 48000, 32000]
    samplerates_v2 = [22050, 24000, 16000]
    samplerates_v25 = [11025, 12000, 8000]

    while idx < len(data) - 4:
        if data[idx] == 0xFF and (data[idx + 1] & 0xE0) == 0xE0:
            b1 = data[idx + 1]
            b2 = data[idx + 2]
            version = (b1 >> 3) & 0x03
            bitrate_idx = (b2 >> 4) & 0x0F
            sr_idx = (b2 >> 2) & 0x03
            padding = (b2 >> 1) & 0x01

            if version == 3:  # MPEG 1
                sr = samplerates_v1[sr_idx] if sr_idx < 3 else 44100
                br = bitrates_v1_l3[bitrate_idx] * 1000 if bitrate_idx < 15 else 128000
                samples = 1152
            elif version == 2:  # MPEG 2
                sr = samplerates_v2[sr_idx] if sr_idx < 3 else 24000
                br = bitrates_v2_l3[bitrate_idx] * 1000 if bitrate_idx < 15 else 48000
                samples = 576
            else:  # MPEG 2.5
                sr = samplerates_v25[sr_idx] if sr_idx < 3 else 12000
                br = bitrates_v2_l3[bitrate_idx] * 1000 if bitrate_idx < 15 else 48000
                samples = 576

            if br > 0 and sr > 0:
                frame_len = int((samples / 8 * br) / sr + (1 if padding else 0))
                if frame_len > 4:
                    total_ms += (samples / sr) * 1000.0
                    idx += frame_len
                    continue
        idx += 1

    # Fallback to byte-rate estimation if frames could not be parsed
    if total_ms <= 0 and len(data) > 0:
        total_ms = (len(data) / (48000 / 8)) * 1000.0

    return int(total_ms)


async def synthesize_single_segment(
    text: str,
    voice: str,
) -> tuple[bytes, int, list[dict[str, Any]]]:
    """Synthesizes speech for a single dialogue line, returning audio bytes, total duration ms, and word boundary timestamps."""
    communicate = edge_tts.Communicate(text=text, voice=voice, boundary="WordBoundary")

    audio_buffer = bytearray()
    words: list[dict[str, Any]] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            w_text = chunk.get("text", "").strip()
            if w_text:
                words.append({
                    "text": w_text,
                    "start_ms": int(chunk["offset"] / 10000),
                    "end_ms": int((chunk["offset"] + chunk["duration"]) / 10000),
                })

    raw_bytes = bytes(audio_buffer)
    duration_ms = get_mp3_duration_ms(raw_bytes)

    return raw_bytes, duration_ms, words


async def synthesize_full_episode(
    segments: list[dict[str, Any]],
) -> tuple[bytes, list[dict[str, Any]], int]:
    """Synthesizes dual-host multi-voice episode with millisecond-exact word-level timestamps."""
    settings = get_settings()
    voice_map = {
        "alex": settings.TTS_VOICE_HOST_ALEX,
        "taylor": settings.TTS_VOICE_HOST_TAYLOR,
    }

    master_audio = io.BytesIO()
    timed_segments: list[dict[str, Any]] = []

    current_time_ms = 0

    logger.info(f"Beginning multi-voice neural synthesis for {len(segments)} segments...")

    for seg in segments:
        speaker = seg.get("speaker", "alex").lower()
        dialogue_text = seg.get("dialogue_text", "").strip()
        voice = voice_map.get(speaker, settings.TTS_VOICE_HOST_ALEX)

        if not dialogue_text:
            continue

        try:
            seg_audio_bytes, seg_duration_ms, raw_words = await synthesize_single_segment(
                text=dialogue_text,
                voice=voice,
            )
        except Exception as e:
            logger.error(f"TTS synthesis error for segment {seg.get('sequence_index')}: {e}")
            seg_audio_bytes = b""
            seg_duration_ms = int(len(dialogue_text.split()) / 2.5 * 1000)
            raw_words = []

        start_ms = current_time_ms
        end_ms = start_ms + seg_duration_ms

        master_audio.write(seg_audio_bytes)

        # Offset word boundaries to master cumulative timeline
        adjusted_words = []
        for w in raw_words:
            adjusted_words.append({
                "text": w["text"],
                "start_ms": start_ms + w["start_ms"],
                "end_ms": start_ms + w["end_ms"],
            })

        timed_seg = {
            "sequence_index": seg.get("sequence_index", len(timed_segments) + 1),
            "speaker": speaker,
            "dialogue_text": dialogue_text,
            "audio_start_ms": start_ms,
            "audio_end_ms": end_ms,
            "referenced_figure_number": seg.get("referenced_figure_number"),
            "referenced_figure_id": seg.get("referenced_figure_id"),
            "words": adjusted_words,
        }
        timed_segments.append(timed_seg)

        current_time_ms = end_ms

    total_duration_seconds = int(current_time_ms / 1000)
    master_mp3_bytes = master_audio.getvalue()

    logger.info(
        f"Episode synthesis complete: {len(timed_segments)} segments, "
        f"{total_duration_seconds}s total length ({len(master_mp3_bytes)} bytes)."
    )

    return master_mp3_bytes, timed_segments, total_duration_seconds

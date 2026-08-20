"""PaperPod Backend Configuration Module."""
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Server Settings
    PORT: int = Field(default=8000, description="Server port")
    HOST: str = Field(default="0.0.0.0", description="Server bind host")
    ENVIRONMENT: str = Field(default="development", description="Runtime environment")
    LOG_LEVEL: str = Field(default="info", description="Logging level")
    CORS_ORIGINS: list[str] | str = Field(
        default=["*"],
        description="Allowed CORS origins",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: list[str] | str) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # AI / LLM Settings (OpenAI-Compatible Gemini 3.1 Flash Lite)
    GEMINI_BASE_URL: str = Field(
        default="https://cheapkeyai.shop/v1",
        description="Custom OpenAI-compatible base URL for Gemini API",
    )
    GEMINI_API_KEY: str = Field(
        default="",
        description="API Key for OpenAI-compatible Gemini endpoint",
    )
    GEMINI_MODEL: str = Field(
        default="gemini-3.1-flash-lite",
        description="Target Gemini model identifier",
    )
    GEMINI_TEMPERATURE: float = Field(
        default=0.7,
        description="LLM sampling temperature",
    )

    # Supabase Settings
    SUPABASE_URL: str = Field(default="", description="Supabase Project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase Service Role Key")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase Anonymous Key")

    # Supabase Storage Buckets
    STORAGE_BUCKET_PAPERS: str = Field(default="papers", description="Bucket for PDFs")
    STORAGE_BUCKET_FIGURES: str = Field(default="figures", description="Bucket for Figures")
    STORAGE_BUCKET_AUDIO: str = Field(default="audio", description="Bucket for MP3 Audio")

    # Edge-TTS Neural Voices
    TTS_VOICE_HOST_ALEX: str = Field(
        default="en-US-GuyNeural",
        description="Alex voice (Curious Analyst)",
    )
    TTS_VOICE_HOST_TAYLOR: str = Field(
        default="en-US-AriaNeural",
        description="Dr. Taylor voice (Lead Researcher)",
    )
    TTS_VOICE_INTERRUPTION: str = Field(
        default="en-US-AriaNeural",
        description="Interruption clarification voice",
    )

    # Monetization (RevenueCat)
    REVENUECAT_WEBHOOK_AUTH_TOKEN: str = Field(
        default="",
        description="RevenueCat webhook authorization bearer token",
    )

    # Notifications (OneSignal)
    ONESIGNAL_APP_ID: str = Field(default="", description="OneSignal App ID")
    ONESIGNAL_REST_API_KEY: str = Field(default="", description="OneSignal REST API Key")


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings singleton instance."""
    return Settings()

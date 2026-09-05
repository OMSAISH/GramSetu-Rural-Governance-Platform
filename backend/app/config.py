import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "GramSetu"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "gramsetu-super-secret-key-development-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./gramsetu.db"
    )
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # LLM fallback key if available
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()

# Normalize Postgres URLs from providers like Supabase/Render (e.g. postgres:// -> postgresql+asyncpg://)
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif settings.DATABASE_URL.startswith("postgresql://") and not settings.DATABASE_URL.startswith("postgresql+asyncpg://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

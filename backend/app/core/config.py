from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Government Leave Portal API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"  # dev, production
    
    # Security
    ENABLE_DOCS: bool = False
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Clerk
    CLERK_JWKS_URL: str = "https://central-snapper-39.clerk.accounts.dev/.well-known/jwks.json"
    CLERK_AUDIENCE: str = ""

    # Infrastructure
    DATABASE_URL: str = "postgresql://user:password@db:5432/app_db"
    REDIS_URL: str = "redis://redis:6379/0"
    UPLOAD_DIR: str = "/app/uploads"

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "The Road - Language Learning Platform"
    ENVIRONMENT: str = "production"
    
    # Database
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    
    # External Auth JWT Configuration
    JWT_SECRET_KEY: str = Field(..., validation_alias="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    
    # Storage
    UPLOAD_DIR: str = "storage_mount/voice_memos"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

    ANTHROPIC_API_KEY: str

    CHROMA_DB_PATH: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "study_notes"

    EMBEDDING_MODEL_NAME: str = "nomic-embed-text"

    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

settings = Settings()

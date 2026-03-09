import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # .env 파일의 위치를 프로젝트 루트 디렉토리로 명시적으로 지정
    # 현재 파일(config.py) -> app -> ai-server -> .env
    model_config = SettingsConfigDict(env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

    # API 키 (환경 변수 'ANTHROPIC_API_KEY'로부터 로드)
    ANTHROPIC_API_KEY: str

    # ChromaDB 설정
    CHROMA_DB_PATH: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "study_notes"

    # 임베딩 모델 설정
    EMBEDDING_MODEL_NAME: str = "nomic-embed-text"

    # CORS 설정
    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

# 설정 객체 생성 (이 객체를 다른 파일에서 import하여 사용)
settings = Settings()

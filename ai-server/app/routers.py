from typing import Optional

from fastapi import APIRouter, Depends, Form, UploadFile, File

# 1. services.py에서 정의한 ai_service 객체를 가져온다.
from .services import AIService, ai_service

router = APIRouter()

def get_ai_service() -> AIService:
    return ai_service

@router.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: Optional[UploadFile] = File(None),
        service: AIService = Depends(get_ai_service) # 의존성 주입
):
    result = await service.analyze_content(prompt, file)
    return result

@router.get("/search-memory")
def search_memory(
        query: str,
        service: AIService = Depends(get_ai_service) # 의존성 주입
):
    result = service.search_memory(query)
    return result

@router.get("/")
def read_root():
    return {"message": "AI Server 실행중!"}

from typing import Optional

from fastapi import APIRouter, Depends, Form, UploadFile, File

from .services import AIService, ai_service

router = APIRouter()

def get_ai_service() -> AIService:
    return ai_service

@router.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: Optional[UploadFile] = File(None),
        service: AIService = Depends(get_ai_service)
):
    result = await service.analyze_content(prompt, file)
    return result

@router.get("/search-memory")
def search_memory(
        query: str,
        service: AIService = Depends(get_ai_service)
):
    result = service.search_memory(query)
    return result

@router.get("/")
def read_root():
    return {"message": "AI Server 실행중!"}

from typing import Optional

from fastapi import APIRouter, Depends, Form, UploadFile, File

# 1. services.py에서 정의한 ai_service 객체를 가져온다.
from .services import AIService, ai_service

# 2. FastAPI의 APIRouter를 사용하여 라우트 객체를 생성했다.
#    이 라우터는 나중에 main.py의 FastAPI 앱에 포함(include)된다.
router = APIRouter()

# 3. 의존성 주입(Dependency Injection)을 위한 함수를 정의했다.
#    이 함수는 각 요청마다 AIService 인스턴스를 제공하는 역할을 한다.
#    현재는 단순히 미리 생성된 ai_service 객체를 반환하지만,
#    향후 요청별로 다른 서비스 객체가 필요할 경우 유연하게 대처할 수 있다.
def get_ai_service() -> AIService:
    return ai_service

# 4. /analyze-image 경로에 대한 POST 요청을 처리하는 엔드포인트를 정의했다.
#    - Depends(get_ai_service): 이 엔드포인트가 AIService에 의존함을 선언했다.
#      FastAPI는 요청이 들어올 때 get_ai_service()를 호출하고, 그 반환값을 service 파라미터에 넣어준다.
@router.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: Optional[UploadFile] = File(None),
        service: AIService = Depends(get_ai_service) # 의존성 주입
):
    """
    프롬프트와 이미지를 받아 AI 분석을 수행하고 결과를 반환한다.
    실제 로직은 주입된 AIService 객체의 analyze_content 메소드에 위임된다.
    """
    # 5. 서비스 계층의 메소드를 호출하여 비즈니스 로직을 수행한다.
    result = await service.analyze_content(prompt, file)
    return result

# 6. /search-memory 경로에 대한 GET 요청을 처리하는 엔드포인트를 정의했다.
@router.get("/search-memory")
def search_memory(
        query: str,
        service: AIService = Depends(get_ai_service) # 의존성 주입
):
    """
    쿼리를 받아 메모리(벡터 DB)에서 유사한 내용을 검색한다.
    실제 로직은 주입된 AIService 객체의 search_memory 메소드에 위임된다.
    """
    # 7. 서비스 계층의 메소드를 호출하여 비즈니스 로직을 수행한다.
    result = service.search_memory(query)
    return result

# 8. 루트 경로에 대한 GET 요청을 처리하는 엔드포인트를 정의했다.
@router.get("/")
def read_root():
    return {"message": "AI Server 실행중!"}

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. app 폴더에서 분리된 설정과 라우터를 가져온다.
from app.config import settings
from app.routers import router as api_router

# 2. FastAPI 애플리케이션 인스턴스를 생성한다.
app = FastAPI(
    title="Study-Flow AI Server",
    version="1.0.0"
)

# 3. CORS 미들웨어를 추가한다.
#    허용할 오리진(origin) 목록은 이제 config.py의 settings 객체에서 관리된다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. app/routers.py에서 정의한 라우터들을 앱에 포함시킨다.
#    이제 /analyze-image, /search-memory 등의 모든 API 경로는
#    api_router가 찾아가서 처리하도록 위임된다.
app.include_router(api_router, prefix="/api/v1")

# 5. 서버 실행을 위한 엔트리포인트.
#    'uvicorn main:app --reload' 명령어로 실행할 때 이 부분이 사용된다.(또는 python main.py)
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

    
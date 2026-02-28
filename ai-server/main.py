import os
import uuid
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import uvicorn
from dotenv import load_dotenv
from typing import Optional

# .env 파일 로드
load_dotenv()

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. API 키 설정 (환경변수 관리 권장)
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("Warning: GOOGLE_API_KEY environment variable not set. Please check your .env file.")

genai.configure(api_key=api_key)

# 2. 모델 초기화 (Gemini 2.0 Flash는 속도와 성능이 뛰어납니다)
model = genai.GenerativeModel('gemini-2.0-flash')

# 3. 임베딩 모델 설정 (기존 유지)
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# 4. ChromaDB 설정 (기존 유지)
vector_store = Chroma(
    collection_name="study_notes",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

@app.get("/")
def read_root():
    return {"message": "AI Server is running with Gemini 2.0 Flash!"}

@app.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: Optional[UploadFile] = File(None)
):
    try:
        ai_response = ""
        source_filename = "text_only"

        if file:
            # [CASE 1] 이미지가 있는 경우
            source_filename = file.filename
            file_bytes = await file.read()

            system_instruction = (
                "당신은 프로그래밍 튜터입니다. 업로드된 이미지는 코딩 문제이거나 학습 관련 자료입니다.\n"
                "1. 이미지의 내용을 정확히 분석하고 사용자의 질문에 답변하세요.\n"
                "2. 코드가 포함된 경우, 코드를 복구하고 실행 결과를 예측하거나 오류를 수정하세요.\n"
                "3. 답변은 반드시 한국어로 작성하세요.\n"
                "4. 답변 마지막에 반드시 아래 형식의 JSON 퀴즈를 포함하세요.\n"
                "###QUIZ### {\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"answer\": \"...\"} ###QUIZ###"
            )

            response = model.generate_content([
                {"mime_type": file.content_type, "data": file_bytes},
                f"{system_instruction}\n\n사용자 질문: {prompt}"
            ])
            ai_response = response.text
        else:
            # [CASE 2] 이미지가 없는 경우 (텍스트 전용)
            system_instruction = (
                "당신은 프로그래밍 튜터입니다. 사용자의 질문에 답변하고, 관련된 퀴즈를 하나 만들어주세요.\n"
                "1. 사용자의 질문에 대해 상세하고 친절하게 설명해주세요.\n"
                "2. 답변은 반드시 한국어로 작성하세요.\n"
                "3. 답변 마지막에 반드시 아래 형식의 JSON 퀴즈를 포함하세요.\n"
                "###QUIZ### {\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"answer\": \"...\"} ###QUIZ###"
            )
            response = model.generate_content(f"{system_instruction}\n\n사용자 질문: {prompt}")
            ai_response = response.text

        # DB 저장 로직
        doc = Document(
            page_content=f"질문: {prompt}\n답변: {ai_response}",
            metadata={
                "source": source_filename,
                "type": "text_or_image_analysis",
                "id": str(uuid.uuid4())
            }
        )
        vector_store.add_documents([doc])

        return {
            "filename": source_filename,
            "ai_response": ai_response,
            "db_status": "Saved to memory"
        }

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search-memory")
def search_memory(query: str):
    results = vector_store.similarity_search(query, k=3)
    return {"results": [doc.page_content for doc in results]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
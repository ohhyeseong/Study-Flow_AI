import os
import uuid
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import uvicorn
from dotenv import load_dotenv
from typing import Optional
import anthropic

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

# 1. API 키 설정
api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    print("Warning: ANTHROPIC_API_KEY environment variable not set. Please check your .env file.")

# 2. Claude 클라이언트 초기화
client = anthropic.Anthropic(api_key=api_key)

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
    return {"message": "AI Server is running with Claude Sonnet 4.6!"}

@app.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: Optional[UploadFile] = File(None)
):
    try:
        ai_response = ""
        source_filename = "text_only"

        # 입력값 검증
        if not prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt is empty")

        system_instruction = (
            "당신은 프로그래밍 튜터입니다. 한국어로 답변하고 마지막에 반드시 ###QUIZ### 형식을 지키세요.\n"
            "형식: ###QUIZ### {\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"answer\": \"...\"} ###QUIZ###"
        )

        messages = []

        if file:
            source_filename = file.filename
            file_bytes = await file.read()
            base64_image = base64.b64encode(file_bytes).decode("utf-8")
            media_type = file.content_type

            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": f"{system_instruction}\n\n사용자 질문: {prompt}"
                    }
                ],
            })
        else:
            messages.append({
                "role": "user",
                "content": f"{system_instruction}\n\n사용자 질문: {prompt}"
            })

        # API 호출 (최신 모델 사용)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=messages
        )
        
        if response.content and len(response.content) > 0:
            ai_response = response.content[0].text
        else:
            ai_response = "No response from AI."

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
        error_msg = str(e)
        print(f"Error during analysis: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/search-memory")
def search_memory(query: str):
    results = vector_store.similarity_search(query, k=3)
    return {"results": [doc.page_content for doc in results]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
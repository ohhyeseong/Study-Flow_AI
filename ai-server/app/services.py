import base64
import uuid
from typing import Optional

import anthropic
from fastapi import UploadFile, HTTPException
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings

# 1. 만든 config 파일에서 설정값들을 가져온다.
from .config import settings

class AIService:
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        self.embeddings = OllamaEmbeddings(model=settings.EMBEDDING_MODEL_NAME)

        self.vector_store = Chroma(
            collection_name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=settings.CHROMA_DB_PATH
        )

        self.system_instruction = (
            "당신은 프로그래밍 튜터입니다. 한국어로 답변하고 마지막에 반드시 ###QUIZ### 형식을 지키세요.\n"
            "형식: ###QUIZ### {\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"answer\": \"...\"} ###QUIZ###"
        )

    async def analyze_content(self, prompt: str, file: Optional[UploadFile] = None) -> dict:
        try:
            source_filename = "text_only"
            messages = []

            if file:
                source_filename = file.filename
                file_bytes = await file.read()
                base64_image = base64.b64encode(file_bytes).decode("utf-8")
                media_type = file.content_type

                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": base64_image}},
                        {"type": "text", "text": f"{self.system_instruction}\n\n사용자 질문: {prompt}"}
                    ],
                })
            else:
                messages.append({
                    "role": "user",
                    "content": f"{self.system_instruction}\n\n사용자 질문: {prompt}"
                })

            response = self.client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=messages
            )

            ai_response = response.content[0].text if response.content else "No response from AI."

            doc = Document(
                page_content=f"질문: {prompt}\n답변: {ai_response}",
                metadata={
                    "source": source_filename,
                    "type": "text_or_image_analysis",
                    "id": str(uuid.uuid4())
                }
            )
            self.vector_store.add_documents([doc])

            return {
                "filename": source_filename,
                "ai_response": ai_response,
                "db_status": "Saved to memory"
            }
        except Exception as e:
            print(f"Error in AIService: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def search_memory(self, query: str) -> dict:
        results = self.vector_store.similarity_search(query, k=3)
        return {"results": [doc.page_content for doc in results]}

ai_service = AIService()
    
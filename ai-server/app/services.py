import base64
import uuid
from typing import Optional

import anthropic
from fastapi import UploadFile, HTTPException
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings

from .config import settings

import tenacity

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
            "당신은 일타 강사입니다. 물어본건 무조건 한국어로 답변하고, 이해가 쉽게 설명을 해주세요. 그리고 마지막에 반드시 ###QUIZ### 형식을 지키세요.\n"
            "형식: ###QUIZ### {\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"answer\": \"...\", \"explanation\": \"...\"} ###QUIZ###"
        )

        self.primary_model = "claude-sonnet-4-6"
        self.fallback_model = "claude-haiku-4-5-20251001"

        if settings.ANTHROPIC_API_KEY:
            print(f"ANTHROPIC_API_KEY 로드됨 (앞 4자리: {settings.ANTHROPIC_API_KEY[:4]}***)")
        else:
            print("ERROR: ANTHROPIC_API_KEY가 로드되지 않았습니다!")

    @tenacity.retry(
        stop=tenacity.stop_after_attempt(3),
        wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
        retry=tenacity.retry_if_exception_type((anthropic.InternalServerError, anthropic.RateLimitError, anthropic.APIStatusError)),
        before_sleep=lambda retry_state: print(f"AI 서비스 일시적 지연(상태 코드: {retry_state.outcome.exception().status_code if hasattr(retry_state.outcome.exception(), 'status_code') else 'N/A'}). {retry_state.attempt_number}차 재시도 중..."),
        reraise=True
    )
    async def _call_anthropic(self, messages, model):
        return self.client.messages.create(
            model=model,
            max_tokens=1024,
            messages=messages
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

            # 1차 시도: 메인 모델 (Sonnet)
            try:
                response = await self._call_anthropic(messages, self.primary_model)
            except Exception as e:
                print(f"메인 모델({self.primary_model}) 실패: {e}. 폴백 모델({self.fallback_model})로 전환합니다.")
                # 2차 시도: 폴백 모델 (Haiku)
                response = await self._call_anthropic(messages, self.fallback_model)

            ai_response = response.content[0].text if response.content else "No response from AI."

            # 벡터 저장소 저장은 선택 사항으로 처리 (Ollama 등이 없어도 응답은 나가도록 함)
            try:
                doc = Document(
                    page_content=f"질문: {prompt}\n답변: {ai_response}",
                    metadata={
                        "source": source_filename,
                        "type": "text_or_image_analysis",
                        "id": str(uuid.uuid4())
                    }
                )
                self.vector_store.add_documents([doc])
            except Exception as store_error:
                print(f"메모리 저장 중 오류 발생 (무시하고 진행): {store_error}")

            return {
                "filename": source_filename,
                "ai_response": ai_response,
                "db_status": "Response generated (Storage failed but response sent)"
            }
        except Exception as e:
            print(f"Error in AIService: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def search_memory(self, query: str) -> dict:
        results = self.vector_store.similarity_search(query, k=3)
        return {"results": [doc.page_content for doc in results]}

ai_service = AIService()
    
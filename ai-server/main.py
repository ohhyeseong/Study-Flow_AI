import base64
import io
import uuid
import easyocr
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_chroma import Chroma
from langchain_core.documents import Document
import uvicorn
from PIL import Image
from deep_translator import GoogleTranslator

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. AI 모델 설정
# - Llama 3.2: 텍스트 분석 및 코딩 문제 풀이용
llm_text = ChatOllama(model="llama3.2", temperature=0)
# - Moondream: 일반 이미지 설명용 (텍스트가 없을 때 사용)
llm_vision = ChatOllama(model="moondream", temperature=0)

# 2. 임베딩 모델 설정
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# 3. ChromaDB 설정
vector_store = Chroma(
    collection_name="study_notes",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# 4. EasyOCR 리더 초기화
reader = easyocr.Reader(['ko', 'en'])

def extract_text_from_image(image_file: UploadFile) -> str:
    try:
        image_file.file.seek(0)
        image_bytes = image_file.file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        # 이미지 전처리
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        result = reader.readtext(binary, detail=0)
        return " ".join(result)
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        return ""
    finally:
        image_file.file.seek(0)

def encode_image_to_base64(image_file: UploadFile) -> str:
    try:
        image_file.file.seek(0)
        image = Image.open(image_file.file)
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
    except Exception as e:
        return ""
    finally:
        image_file.file.seek(0)

@app.get("/")
def read_root():
    return {"message": "AI Server is running!"}

@app.post("/analyze-image")
async def analyze_image(
        prompt: str = Form(...),
        file: UploadFile = File(...)
):
    # 1. OCR로 텍스트 추출
    extracted_text = extract_text_from_image(file)
    print(f"Extracted Text: {extracted_text}")

    ai_response = ""
    mode = ""

    # 공유 퀴즈 가이드 (텍스트가 있든 없든 마지막에 퀴즈를 붙이게 함)
    quiz_instruction = (
        "\n\n--- 필수 요구사항 ---\n"
        "답변 마지막에 반드시 ###QUIZ### 태그를 사용해 JSON 형식의 퀴즈를 포함하세요.\n"
        "형식: ###QUIZ### {\"question\": \"문제\", \"options\": [\"1번\", \"2번\", \"3번\", \"4번\"], \"answer\": \"정답번호\"} ###QUIZ###"
    )

    # 2. 분기 처리: 텍스트 유무에 따라 다른 모델 사용
    if extracted_text.strip():
        # [CASE A] 텍스트가 있음 -> Llama 3.2로 문제 풀이
        mode = "Text/Code Analysis"
        
        system_prompt = (
                "당신은 프로그래밍 튜터입니다. OCR로 추출된 코드를 복구하고 설명하세요. "
                "모든 설명은 한국어로 하세요." + quiz_instruction
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"OCR 텍스트: {extracted_text}\n사용자 질문: {prompt}"),
        ]
        
        response = llm_text.invoke(messages)
        ai_response = response.content

    else:
        # [CASE B] 텍스트가 없음 -> Moondream으로 이미지 설명
        mode = "General Image Description"
        base64_image = encode_image_to_base64(file)

        # 1단계: Moondream으로 이미지 묘사 (영문)
        messages = [
            SystemMessage(content="Describe this image in detail."),
            HumanMessage(content=[{"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}]),
        ]
        vision_res = llm_vision.invoke(messages)

        # 2단계: 묘사된 내용을 Llama 3.2에게 전달하여 한국어 설명 + 퀴즈 생성 (이게 더 정확함)
        refine_prompt = (
                f"다음은 이미지에 대한 설명이야: {vision_res.content}\n"
                f"이 내용을 바탕으로 사용자의 질문('{prompt}')에 한국어로 답하고 퀴즈를 하나 내줘."
                + quiz_instruction
        )
        response = llm_text.invoke([HumanMessage(content=refine_prompt)])
        ai_response = response.content

    # 3. ChromaDB에 저장
    doc = Document(
        page_content=f"질문: {prompt}\n모드: {mode}\nOCR 텍스트: {extracted_text}\n답변: {ai_response}",
        metadata={
            "source": file.filename,
            "type": "image_analysis",
            "id": str(uuid.uuid4())
        }
    )
    vector_store.add_documents([doc])

    return {
        "filename": file.filename,
        "user_prompt": prompt,
        "mode": mode,
        "extracted_text": extracted_text,
        "ai_response": ai_response,
        "db_status": "Saved to memory"
    }

@app.get("/search-memory")
def search_memory(query: str):
    results = vector_store.similarity_search(query, k=3)
    return {"results": [doc.page_content for doc in results]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
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

    # 2. 분기 처리: 텍스트 유무에 따라 다른 모델 사용
    if extracted_text.strip():
        # [CASE A] 텍스트가 있음 -> Llama 3.2로 문제 풀이
        mode = "Text/Code Analysis"
        
        system_prompt = (
            "You are an expert programming tutor. "
            "The text provided below is extracted from an image using OCR and contains BROKEN code. "
            "Your task is to RECONSTRUCT the code exactly as intended and SOLVE the problem. "
            "\n\n"
            "IMPORTANT RULES:\n"
            "1. Respond in KOREAN, but keep the code in ENGLISH.\n"
            "2. Do NOT invent 'if' conditions or logic that are not present in the OCR text.\n"
            "3. Infer the input values from the user's prompt or the OCR text context.\n"
            "\n\n"
            "Common OCR Error Patterns to fix:\n"
            "- 'Iair', 'rnain' -> 'main'\n"
            "- 'irt' -> 'int'\n"
            "- '1en', '1eri', 'lenl' -> 'len'\n"
            "- 'gets (str)' -> 'gets(str);'\n"
            "- 'printE', 'priritf' -> 'printf'\n"
            "- '용d' -> '%d'\n"
            "\n\n"
            f"OCR Text:\n{extracted_text}\n\n"
            "Task:\n"
            "1. Reconstruct the correct code.\n"
            "2. Explain the logic step-by-step in Korean.\n"
            "3. Provide the final output."
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt),
        ]
        
        response = llm_text.invoke(messages)
        ai_response = response.content

    else:
        # [CASE B] 텍스트가 없음 -> Moondream으로 이미지 설명
        mode = "General Image Description"
        base64_image = encode_image_to_base64(file)
        
        # 한국어 질문 -> 영어 번역 (Moondream용)
        try:
            translated_prompt = GoogleTranslator(source='auto', target='en').translate(prompt)
        except Exception:
            translated_prompt = prompt

        system_prompt = (
            "You are a helpful AI assistant. "
            "Describe the image in detail and answer the user's question."
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(
                content=[
                    {"type": "text", "text": translated_prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{base64_image}"},
                    },
                ]
            ),
        ]
        
        response = llm_vision.invoke(messages)
        english_response = response.content
        
        # 영어 답변 -> 한국어 번역
        try:
            ai_response = GoogleTranslator(source='en', target='ko').translate(english_response)
        except Exception:
            ai_response = english_response

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
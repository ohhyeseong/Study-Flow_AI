# 📚 Study-Flow: AI 기반 맞춤형 학습 보조 서비스

> 사용자가 업로드한 학습 자료(이미지)를 분석하고, 음성 인터페이스를 통해 대화형 학습 및 퀴즈 생성을 지원하는 통합 AI 학습 보조 서비스입니다.

---

## 🛠 Tech Stack (기술 스택)

### Backend & AI Infrastructure
* Main Server: Java 21 / Spring Boot 3.x
* AI Orchestration: LangChain (전체 AI 로직 체이닝)
* AI Server: Python 3.11~3.12 / FastAPI
* Database: MySQL (사용자 및 학습 이력 관리)
* Vector DB: ChromaDB (지식 베이스 및 RAG 구현)

### AI Models & Engines
* Vision & LLM: Ollama (Llama 3.2, Moondream) - 이미지 분석 및 문제 풀이/생성
* Embedding: nomic-embed-text - 벡터 데이터 저장용
* OCR: EasyOCR - 이미지 내 텍스트 추출

---

## 📂 Project Structure (폴더 구조)

Study-Flow/
├── study-flow-server/       # Spring Boot 메인 서버 (포트: 8081)
│   ├── src/main/java/       # 자바 소스 코드
│   └── src/main/resources/  # 설정 파일 (application.yaml 등)
├── study-flow-ai/           # Python AI 통합 서버 (포트: 8000)
│   ├── main.py              # FastAPI 엔드포인트 및 OCR 로직
│   ├── chroma_db/           # 벡터 데이터베이스 저장 폴더
│   └── venv/                # 가상환경 (버전 3.12 권장)
└── README.md

---

## 🚀 Environment Setup (환경 설정)

### 1. AI 모델 준비 (Ollama)
로컬에서 AI 모델을 구동하기 위해 Ollama 설치가 필수입니다. 설치 후 터미널에서 아래 모델들을 반드시 다운로드하세요.

[명령어 목록]
ollama pull llama3.2
ollama pull moondream
ollama pull nomic-embed-text

Tip: 설치 후 ollama 명령어를 찾을 수 없다면 IDE(IntelliJ 등)를 완전히 종료 후 다시 실행하세요.

### 2. Python 환경 설정
호환성을 위해 Python 3.11 또는 3.12 사용을 강력히 권장합니다. (3.14+ 버전은 라이브러리 충돌 가능성 있음)

[가상환경 설정 및 라이브러리 설치]
1. py -3.12 -m venv .venv
2. .venv\Scripts\activate
3. pip install fastapi uvicorn easyocr numpy opencv-python langchain-ollama langchain-chroma pillow deep-translator python-multipart pydantic-settings pydantic==2.10.0

---

## 🛠 Troubleshooting (팀원 필독!)

### Q1. Spring Boot 실행 시 DB 연결 에러가 발생합니다.
* 증상: Failed to configure a DataSource 또는 Access denied for user 'root'
* 해결: study-flow-server/src/main/resources/application.yaml 파일을 확인하세요.
* 주의: 설정 파일 위치가 src/main/resources인지 꼭 확인해야 합니다.
* MySQL: 로컬에 demo 스키마를 생성하고, 비밀번호를 본인 설정에 맞게 수정하세요.

### Q2. Python 서버 실행 시 ConfigError가 발생합니다.
* 증상: pydantic.v1.errors.ConfigError: unable to infer type for attribute "chroma_server_nofile"
* 해결: Python 3.13 이상 버전과의 호환성 문제입니다. 반드시 3.12 이하 버전의 가상환경을 사용하고, pydantic==2.10.0 버전을 설치하세요.

---

## 🏃 실행 방법

### 🤖 AI 통합 서버 (Python/FastAPI)
1. study-flow-ai 폴더로 이동
2. python main.py 실행 (또는 uvicorn main:app --reload --port 8000)
3. http://localhost:8000/ 접속 시 "AI Server is running!" 메시지 확인

### ☕ 메인 백엔드 서버 (Spring Boot)
1. study-flow-server 폴더로 이동
2. ./gradlew bootRun 실행 (포트: 8081)

---

## 🌿 Branch Strategy & Commit Convention
* Branch: main (릴리즈), dev (통합 개발), feature/기능명 (단위 기능)
* Commit Prefix: [Feat], [Fix], [Docs], [Refactor], [Chore]

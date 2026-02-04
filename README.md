# 📚 Study-Flow: AI 기반 맞춤형 학습 보조 서비스

> 사용자가 업로드한 학습 자료(이미지)를 분석하고, 음성 인터페이스를 통해 대화형 학습 및 퀴즈 생성을 지원하는 통합 AI 학습 보조 서비스입니다.

---

## 🛠 Tech Stack (기술 스택)

### Backend & AI Infrastructure
* **Main Server:** Java 17 / Spring Boot 3.x
* **AI Orchestration:** **LangChain** (전체 AI 로직 체이닝)
* **AI Server:** Python 3.10+ / FastAPI
* **Database:** MySQL (사용자 및 학습 이력 관리)
* **Vector DB:** **ChromaDB** (지식 베이스 및 RAG 구현)

### AI Models & Engines
* **Vision & LLM:** **Ollama (Llama 3.2-Vision)** - 이미지 분석 및 문제 생성
* **STT (Speech-to-Text):** **OpenAI Whisper** - 사용자 음성 질문 인식
* **TTS (Text-to-Speech):** **Coqui TTS** - AI 답변 및 퀴즈 음성 출력

---

## 📂 Project Structure (폴더 구조)

```text
Study-Flow/
├── study-flow-server/       # Spring Boot 메인 서버 (포트: 8080)
│   └── src/main/java/com/studyflow/
├── study-flow-ai/           # Python AI 통합 서버 (포트: 8000)
│   ├── main.py              # FastAPI 엔드포인트
│   ├── chain.py             # LangChain 기반 로직 통합 (핵심)
│   ├── vision_module.py     # Llama 3.2-Vision 이미지 분석
│   ├── audio_module.py      # Whisper(STT) & Coqui(TTS) 엔진
│   └── chromadb_utils.py    # 벡터 저장소 관리
└── README.md

---

## 🌿 Branch Strategy (브랜치 전략)

**※ 본 프로젝트는 GitHub Ruleset에 의해 보호됩니다. 모든 병합은 PR을 통해 이루어집니다.**

* **`main`**: 최종 릴리즈 브랜치 (가장 안정된 상태의 코드만 관리)
* **`dev`**: **기준 개발 브랜치** (모든 팀원의 기능이 모여 통합 테스트되는 공간)
* **`feature/기능명`**: 단위 기능별 개발 브랜치
    * 예: `feature/stt-whisper`, `feature/tts-coqui`, `feature/langchain-setup`

### 💡 협업 프로세스
1. `dev` 브랜치에서 자신의 기능을 구현할 `feature` 브랜치를 생성합니다.
   - `git checkout dev`
   - `git pull origin dev`
   - `git checkout -b feature/기능명`
2. 기능 구현 완료 후 `push` 하고 GitHub 웹사이트에서 **Pull Request(PR)**를 생성합니다.
3. **팀원의 승인(Approve)**을 최소 1명 이상 받은 후 `dev` 브랜치에 최종 병합(Merge)합니다.

---

## 📝 Commit Message Convention (커밋 규칙)

작업 내용을 직관적으로 파악하기 위해 아래 머리말(Prefix)을 사용합니다.
* `[Feat]`: 새로운 기능 추가 (예: Whisper API 연동)
* `[Fix]`: 버그 수정
* `[Docs]`: 문서 수정 (README, API 가이드, 주석 등)
* `[Refactor]`: 코드 리팩토링 (기능은 유지하되 구조 개선)
* `[Chore]`: 패키지 설치, 빌드 설정 변경, 파일 이동 등 잡무

---

## 🚀 Environment Setup (환경 설정)

### 1. AI 모델 준비
* **Ollama**를 설치한 후, 이미지 분석을 위해 아래 모델을 반드시 다운로드해야 합니다.
  ```bash
  ollama pull llama3.2-vision

### 2. Python 라이브러리 설치
프로젝트 구동에 필요한 핵심 라이브러리들을 아래 명령어로 설치합니다. (Python 3.10 이상 권장)
```bash
pip install langchain langchain-community ollama openai-whisper TTS fastapi uvicorn chromadb

### 3. 서버 실행 방법

#### 🤖 AI 통합 서버 (Python/FastAPI)
1. `study-flow-ai` 폴더로 이동합니다.
2. 아래 명령어를 실행하여 서버를 가동합니다.
   - 명령어: `uvicorn main:app --reload --port 8000`
   - 서버 실행 후 `http://localhost:8000/docs`에서 API 명세(Swagger) 확인이 가능합니다.

#### ☕ 메인 백엔드 서버 (Spring Boot)
1. `study-flow-server` 폴더로 이동합니다.
2. Gradle을 이용하여 프로젝트를 빌드하고 실행합니다.
   - **Windows (CMD/PowerShell):** `./gradlew bootRun`
   - **Mac/Linux:** `./gradlew bootRun`
   - 메인 서버는 `http://localhost:8081`에서 구동됩니다.

---

## 🛠 초기 개발 가이드 (팀원 필독)

1. **브랜치 생성:** 새로운 기능을 개발하기 전 반드시 `dev` 브랜치에서 최신 코드를 `pull` 받은 후, `feature/기능명` 브랜치를 생성하세요.
   - 절차: `git checkout dev` -> `git pull origin dev` -> `git checkout -b feature/기능명`
2. **API 통신:** Spring Boot 서버와 FastAPI 서버 간의 데이터 교환은 JSON 형식을 원칙으로 합니다.
3. **모델 가중치:** Whisper와 Coqui TTS 모델은 첫 실행 시 자동으로 다운로드되므로, 안정적인 네트워크 환경에서 처음 구동하는 것을 권장합니다.
4. **코드 리뷰:** 기능 구현 후 PR을 올리면 다른 팀원의 승인(Approve)을 최소 1개 이상 받아야 머지할 수 있습니다. 직접 Push는 Ruleset에 의해 차단됩니다.


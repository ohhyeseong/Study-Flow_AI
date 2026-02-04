# 📚 Study-Flow: AI 기반 맞춤형 학습 보조 서비스

> 사용자가 업로드한 학습 자료(이미지)를 AI(Llama 3.2-Vision)가 분석하여 맞춤형 퀴즈를 생성하고 학습 상태를 관리해주는 서비스입니다.

---

## 🛠 Tech Stack (기술 스택)

### Backend & AI
* **Main Server:** Java 17 / Spring Boot 3.x
* **AI Server:** Python 3.10+ / FastAPI
* **Database:** MySQL (사용자 및 학습 이력 관리)
* **Vector DB:** **ChromaDB** (이미지 분석 데이터 및 지식 저장)
* **AI Model:** **Llama 3.2-Vision** (Ollama 기반 로컬 실행)

### Infrastructure
* **VCS:** GitHub
* **Communication:** Slack, Notion

---

## 📂 Project Structure (폴더 구조)

```text
Study-Flow/
├── study-flow-server/       # Spring Boot 서버 (포트: 8080)
│   └── src/main/java/com/studyflow/
├── study-flow-ai/           # Python AI 서버 (포트: 8000)
│   ├── main.py              # FastAPI 엔드포인트
│   ├── chromadb_utils.py    # ChromaDB 연결 및 검색 로직
│   └── vision_module.py     # Llama 3.2-Vision 호출 로직
└── README.md

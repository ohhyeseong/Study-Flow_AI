# 📚 Study-Flow: AI 기반 맞춤형 학습 보조 서비스

> 사용자가 공부한 이미지(문제집, 필기 등)를 분석하여 자동으로 퀴즈를 생성하고 학습을 돕는 AI 서비스입니다.

---

## 🛠 Tech Stack (기술 스택)

### Backend
* **Main Server:** Java 17, Spring Boot 3.x
* **AI & Data Server:** Python 3.10+, FastAPI
* **Database:** MySQL (사용자/기록 관리), **ChromaDB (AI 지식 저장소)**
* **AI Model:** **Llama 3.2-Vision (Ollama)**

### Infrastructure
* **Version Control:** GitHub
* **Communication:** Slack / Notion

---

## 📂 Project Structure (폴더 구조)

```text
Study-Flow/
├── study-flow-server/       # Spring Boot 메인 서버
│   └── src/main/java/com/studyflow/
├── study-flow-ai/           # Python AI 서버 (FastAPI/Ollama)
│   ├── main.py
│   └── chromadb_utils.py
└── .gitignore               # 프로젝트 공통 제외 파일

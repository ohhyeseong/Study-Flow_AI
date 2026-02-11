# 1. 파이썬 베이스 이미지 선택 (OCR 라이브러리 용량을 고려해 full 버전 추천)
FROM python:3.11

# 2. 필수 시스템 패키지 설치 (OpenCV, EasyOCR 실행에 필요)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 종속성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스 코드 복사
COPY . .

# 6. 서버 실행 (8000 포트)
CMD ["python", "main.py"]
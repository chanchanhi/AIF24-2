import os
import streamlit as st
import openai
from fastapi import FastAPI, Request    # 추가
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware    # 추가

# .env 파일 로드
load_dotenv()

# ChatGPT API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()    # 추가

# CORS 해결 (추가)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 번역 기능
def translate_text(text):
    # 추가 (try-catch문)
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Translate the following text to Korean."},
                {"role": "user", "content": text}
            ],
            max_tokens=1000
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        print("OpenAI API error:", e)
        return "Translation failed"

st.title("Translation API")

# FastAPI 엔드포인트 정의
@app.post("/translate")
async def translate(request: Request):
    data = await request.json()
    text = data.get("text", "")
    translated_text = translate_text(text)
    return {"translated_text": translated_text}

# Streamlit 앱 설정
def main():
    st.title("Translation API (with FastAPI)")
    st.write("POST 요청을 통해 번역된 텍스트가 반환됩니다.")

if __name__ == "__main__":
    main()
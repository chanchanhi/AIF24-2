import os
import streamlit as st
import openai
from fastapi import FastAPI, Request
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드
load_dotenv()

# ChatGPT API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# CORS 문제 해결
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 고정된 프롬프트를 이용한 번역 기능
def translate_text_with_prompt(selected_text):
    # 사용자 지정 프롬프트
    prompt = f"""
    너는 이제부터 한국어의 신조어는 표준어로, 
    상식 수준 이상의 고난이도 한자어 및 전문 용어는 쉬운 표현으로 번역해주는 번역가야. 
    앞으로 아래 명령을 수행해. 아래 유의사항 또한 숙지하도록 해.

    입력 : {selected_text}

    업무 : 아래 단계를 통해 입력으로부터 신조어나 고난이도 한자어, 전문 용어를 탐지한 후 번역. (탐지해야하는 기준에 대해 설명해줘야함)
    1. 문장에서 신조어, 고난이도 한자어, 전문 용어를 탐지해 굵은 글씨로 표시
    2-1. 검출한 신조어 표현 번역: 반드시 인터넷 검색을 통해 해당 신조어 의미 파악 후, 검색 결과를 바탕으로 신조어를 표준어 표현으로 순화.
    2-2. 검출한 한자어, 전문 용어 표현 번역: 검출한 표현을 쉬운 표현으로 순화(단계별에 따른 순화결과)
    3. 다음과 같은 포맷으로 출력
            {{변환한 문장, 변환한 표현은 굵은 글씨}}

    유의 사항: 
    # 과도한 번역 제재.
    - 모두가 알 만한 쉬운 한자어는 번역 대상에서 제외
    # 할루시네이션 방지를 위해 신조어는 번역 전 검색을 강제함.
    - 신조어 번역 전 최대한 신뢰할 수 있는 정보를 주기 위해 무조건 인터넷 검색을 먼저 수행 후, 해당 자료 기반으로 번역 수행. 
            알고 있는 신조어여도 인터넷 검색을 통해 신조어의 의미 파악.
    - 제시한 출력 형태 이외의 문장을 출력하지 않아야 함. 중괄호는 제외.
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        print("OpenAI API error:", e)
        return "Translation failed"

# FastAPI 엔드포인트 정의
@app.post("/translate")
async def translate(request: Request):
    data = await request.json()
    text = data.get("text", "")
    translated_text = translate_text_with_prompt(text)
    return {"translated_text": translated_text}

# Streamlit 앱 설정
def main():
    st.title("Translation API (with FastAPI)")
    st.write("POST 요청을 통해 고정된 프롬프트로 번역된 텍스트가 반환됩니다.")

if __name__ == "__main__":
    main()
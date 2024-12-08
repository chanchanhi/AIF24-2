import os
import streamlit as st
import openai
from fastapi import FastAPI, Request
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import re

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

def translate_text_with_prompt(selected_text):
    # 사용자 지정 프롬프트
    prompt = f"""
    너는 이제부터 한국어의 신조어는 표준어로, 
    상식 수준 이상의 고난이도 한자어 및 전문 용어는 쉬운 표현으로 번역해주는 번역가야. 
        '입력'을 바탕으로 '업무'를 수행한 후 '출력'에서 명세한 형식에 맞춰 결과를 반환해. 아래 유의사항 또한 숙지하도록 해.
        '입력'과 '업무'의 내용은 출력하지 않아야 해.


        입력 : {selected_text}

        업무 : 아래 단계를 통해 입력으로부터 신조어나 고난이도 한자어, 전문 용어를 탐지한 후 번역. 
        1. 문장에서 신조어, 고난이도 한자어, 전문 용어를 탐지해 굵은 글씨로 표시
        2-1. 검출한 신조어 표현 번역: 반드시 인터넷 검색을 통해 신조어 의미 파악 후, 표준어 표현으로 순화.
        2-2. 검출한 한자어, 전문 용어 표현 번역: 쉬운 표현으로 순화
        
        출력 : 번역 결과 문장만을 출력, 순화한 표현은 굵은 글씨

        유의 사항: 
        - 모두가 알 만한 쉬운 한자어는 번역 대상에서 제외
        - 신조어 번역 전 최대한 신뢰할 수 있는 정보를 주기 위해 무조건 인터넷 검색을 먼저 수행 후, 해당 자료 기반으로 번역 수행. 알고 있는 신조어여도 인터넷 검색을 통해 신조어의 의미 파악.
        - 제시한 출력 형태 이외의 문장을 출력하지 않아야 함. 중괄호는 제외.
    """

    try:
        response = openai.ChatCompletion.create(

            model="gpt-4o",

            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        answer = response.choices[0].message['content'].strip()
        # keywords = re.findall(r'\*\*(.*?)\*\*', answer)
                
        return answer
    except Exception as e:
        print("OpenAI API error:", e)
        return "Translation failed: OpenAI API ERROR"



# 재번역 기능 추가

def retranslate_text_with_prompt(word):
    prompt = f"""
    입력된 단어: '{word}'

    업무: 
    1. 주어진 단어를 해석하고 쉬운 표현으로 번역.
    2. 필요한 경우 의미를 보충하거나 명확히 표현.
    3. 단일 단어의 경우 짧고 명확한 문장으로 변환.

    출력: 번역된 단어 또는 표현만을 출력.
    """
    try:
        response = openai.ChatCompletion.create(

            model="gpt-4o",

            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        retranslated_word = response.choices[0].message['content'].strip()
        return retranslated_word
    except Exception as e:
        print("OpenAI API error:", e)
        return "Retranslation failed: OpenAI API ERROR"


# FastAPI 엔드포인트 정의
@app.post("/translate")
async def translate(request: Request):
    data = await request.json()
    text = data.get("text", "")
    translated_text = translate_text_with_prompt(text)
    return {"translated_text": translated_text}

@app.post("/retranslate")
async def retranslate(request: Request):

    # 요청 데이터 추출
    data = await request.json()
    word = data.get("word", "")  # 요청에서 'word' 추출

    # 재번역 로직 수행
    retranslated_word = retranslate_text_with_prompt(word)

    # 결과 반환

    return {"retranslated_word": retranslated_word}


# Streamlit 앱 설정
def main():
    st.title("Translation API (with FastAPI)")
    st.write("POST 요청을 통해 고정된 프롬프트로 번역된 텍스트가 반환됩니다.")

    st.write("번역 결과를 확인하고 클립보드로 복사할 수 있습니다.")

    # 번역 원문 입력
    original_text = st.text_area("번역 원문", placeholder="번역할 문장을 입력하세요.")

    # 번역 요청
    if st.button("번역하기"):
        if original_text:
            translated_text = translate_text_with_prompt(original_text)

            # 번역 결과와 복사 버튼 표시
            st.markdown(
                f"""
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0;">번역 결과</h3>
                    <button onclick="copyToClipboard()" style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        복사하기
                    </button>
                </div>
                <script>
                function copyToClipboard() {{
                    navigator.clipboard.writeText(`{translated_text}`);
                    alert("번역 결과가 클립보드에 복사되었습니다!");
                }}
                </script>
                """,
                unsafe_allow_html=True,
            )

            st.text_area("번역 결과", value=translated_text, height=150)
        else:
            st.error("번역할 문장을 입력하세요.")




if __name__ == "__main__":
    main()
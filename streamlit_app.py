import os
import streamlit as st
import openai
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# ChatGPT API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

def translate_text(text):
    response = openai.Completion.create(
        engine="gpt-3.5-turbo",
        prompt=f"Translate the following text to Korean: {text}",
        max_tokens=1000
    )
    return response.choices[0].text.strip()

st.title("Translation API")

# POST 요청을 처리하는 엔드포인트
if st.experimental_get_query_params():
    text = st.experimental_get_query_params()['text'][0]
    translated_text = translate_text(text)
    st.write({"translated_text": translated_text})


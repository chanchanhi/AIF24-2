
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translateSelection') {
      let selectedText = window.getSelection().toString();
      // 추가
      if (!selectedText) {
          alert("먼저 번역할 텍스트를 선택하세요.");
          return;
      }
      
      // 고정된 프롬프트
      let userPrompt = `너는 이제부터 한국어의 신조어는 표준어로, 
      상식 수준 이상의 고난이도 한자어 및 전문 용어는 쉬운 표현으로 번역해주는 번역가야. 
      앞으로 아래 명령을 수행해. 아래 유의사항 또한 숙지하도록 해.
      
      입력 : ${selectedText}

      업무 : 아래 단계를 통해 입력으로부터 신조어나 고난이도 한자어, 전문 용어를 탐지한 후 번역. (탐지해야하는 기준에 대해 설명해줘야함)
      1. 문장에서 신조어, 고난이도 한자어, 전문 용어를 탐지해 굵은 글씨로 표시
      2-1. 검출한 신조어 표현 번역: 반드시 인터넷 검색을 통해 해당 신조어 의미 파악 후, 
                                                          검색 결과를 바탕으로 신조어를 표준어 표현으로 순화.
      2-2. 검출한 한자어, 전문 용어 표현 번역: 검출한 표현을 쉬운 표현으로 순화(단계별에 따른 순화결과)
      3. 다음과 같은 포맷으로 출력
              변환 전 : {입력으로 들어온 문장, 검출한 표현은 굵은 글씨}
              변환 후: {변환한 문장, 변환한 표현은 굵은 글씨}

      유의 사항: 
      # 과도한 번역 제재.
      - 모두가 알 만한 쉬운 한자어는 번역 대상에서 제외
      # 할루시네이션 방지를 위해 신조어는 번역 전 검색을 강제함.
      - 신조어 번역 전 최대한 신뢰할 수 있는 정보를 주기 위해 무조건 인터넷 검색을 먼저 수행 후, 해당 자료 기반으로 번역 수행. 
              알고 있는 신조어여도 인터넷 검색을 통해 신조어의 의미 파악.
      - 제시한 출력 형태 이외의 문장을 출력하지 않아야 함. 중괄호는 제외.`;

      fetch('http://127.0.0.1:8000/translate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: selectedText })
      })
      .then(response => response.json())
      .then(data => {
          let translatedText = data.translated_text;
          // 추가
          alert(`번역 결과: ${translatedText}`);
      })
      //추가
      .catch(error => {
          console.error("Translation failed:", error);
          alert("번역 중 오류가 발생했습니다.");
      });
  }
});
  
  

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translateSelection') {
      let selectedText = window.getSelection().toString();
      // 추가
      if (!selectedText) {
          alert("먼저 번역할 텍스트를 선택하세요.");
          return;
      }
      
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
  
  
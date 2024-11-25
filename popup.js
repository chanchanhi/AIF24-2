
document.getElementById('translateAll').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: translatePage
      });
  });
});

function translatePage() {
  const allText = document.body.innerText;
  fetch('http://localhost:8000/translate', {  // FastAPI 서버 포트로 변경
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: allText })
  })
  .then(response => response.json())
  .then(data => {
      document.body.innerText = data.translated_text;
  })
  // 추가
  .catch(error => {
      console.error("Translation failed:", error);
  });
}
  
  
  
  
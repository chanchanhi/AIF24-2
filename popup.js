
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
    fetch('http://localhost:8501/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: allText })
    })
    .then(response => response.json())
    .then(data => {
      document.body.innerText = data.translated_text;
    });
  }
  
  
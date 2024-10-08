
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateSelection') {
      let selectedText = window.getSelection().toString();
      fetch('http://localhost:8501/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: selectedText })
      })
      .then(response => response.json())
      .then(data => {
        let translatedText = data.translated_text;
        document.execCommand('insertText', false, translatedText);
      });
    }
  });
  
  
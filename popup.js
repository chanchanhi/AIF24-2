document.getElementById("explainButton").addEventListener("click", () => {
    const inputText = document.getElementById("textInput").value;

    // 입력값 확인
    if (!inputText.trim()) {
        alert("번역할 텍스트를 입력하세요.");
        return;
    }

    // 번역 요청
    fetch('http://127.0.0.1:8000/translate', { // FastAPI 서버 URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputText })
    })
    .then(response => response.json())
    .then(data => {
        const translatedText = data.translated_text;

        // 팝업에서 content.js로 메시지 전송
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "displayInSidePanel",
                originalText: inputText,
                translatedText: translatedText
            });
        });
    })
    .catch(error => {
        console.error("Translation failed:", error);

        // 오류 메시지를 content.js로 전달
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "displayInSidePanel",
                originalText: inputText,
                translatedText: "번역 중 오류가 발생했습니다."
            });
        });
    });
});
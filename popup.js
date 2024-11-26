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

        // content.js의 displayInSidePanel과 동일한 로직 호출
        displayInSidePanel(translatedText, inputText);
    })
    .catch(error => {
        console.error("Translation failed:", error);
        displayInSidePanel("번역 중 오류가 발생했습니다.", inputText);
    });
});

// content.js에서 사용 중인 동일한 사이드 패널 표시 함수 복사
function displayInSidePanel(translatedText, originalText) {
    const existingPanel = document.getElementById("translationSidePanel");
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "translationSidePanel";
    panel.style.position = "fixed";
    panel.style.top = "0";
    panel.style.right = "0";
    panel.style.width = "350px";
    panel.style.height = "100%";
    panel.style.backgroundColor = "#f9f9f9";
    panel.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.2)";
    panel.style.padding = "20px";
    panel.style.overflowY = "auto";
    panel.style.zIndex = "10000";

    // 제목 추가
    const titleContainer = document.createElement("div");
    titleContainer.className = "six";
    titleContainer.style.textAlign = "center";
    titleContainer.style.marginBottom = "20px";

    const title = document.createElement("h1");
    title.style.color = "#c50000";
    title.style.fontSize = "24px";
    title.style.textTransform = "uppercase";
    title.style.wordSpacing = "1px";
    title.style.letterSpacing = "2px";
    title.style.position = "relative";
    title.textContent = "ExplainEasy";

    const subtitle = document.createElement("span");
    subtitle.style.lineHeight = "2em";
    subtitle.style.paddingBottom = "15px";
    subtitle.style.textTransform = "none";
    subtitle.style.fontSize = "0.8em";
    subtitle.style.fontWeight = "normal";
    subtitle.style.fontStyle = "italic";
    subtitle.style.color = "#999";
    subtitle.textContent = "신조어, 한자어, 전문 용어 해설 도구";

    title.appendChild(subtitle);
    titleContainer.appendChild(title);

    // 원문 표시
    const originalTitle = document.createElement("h2");
    originalTitle.textContent = "번역 원문";
    originalTitle.style.marginBottom = "10px";

    const originalParagraph = document.createElement("p");
    originalParagraph.textContent = originalText;
    originalParagraph.style.whiteSpace = "pre-wrap";
    originalParagraph.style.marginBottom = "20px";

    const resutlTitle = document.createElement("h2");
    resutlTitle.textContent = "번역 결과";
    resutlTitle.style.marginBottom = "10px";

    const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const result = document.createElement("p");
    result.innerHTML = formattedText;
    result.style.whiteSpace = "pre-wrap";

    const keywords = [...translatedText.matchAll(/\*\*(.*?)\*\*/g)].map(match => match[1]);

    const keywordList = document.createElement("div");
    keywordList.style.marginTop = "20px";

    const keywordTitle = document.createElement("h3");
    keywordTitle.textContent = "번역된 단어 목록";
    keywordList.appendChild(keywordTitle);

    keywords.forEach(keyword => {
        const keywordRow = document.createElement("div");
        keywordRow.style.display = "flex";
        keywordRow.style.justifyContent = "space-between";
        keywordRow.style.marginBottom = "10px";
        keywordRow.style.alignItems = "center";

        const keywordText = document.createElement("span");
        keywordText.textContent = keyword;

        const retranslateButton = document.createElement("button");
        retranslateButton.textContent = "재번역";
        retranslateButton.style.padding = "5px 10px";
        retranslateButton.style.border = "none";
        retranslateButton.style.borderRadius = "5px";
        retranslateButton.style.backgroundColor = "#007bff";
        retranslateButton.style.color = "#fff";
        retranslateButton.style.cursor = "pointer";

        retranslateButton.addEventListener("click", () => {
            fetch('http://127.0.0.1:8000/retranslate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ word: keyword })
            })
            .then(response => response.json())
            .then(data => {
                const retranslatedWord = data.retranslated_word;
                displayRetranslation(keywordText, retranslatedWord);
            })
            .catch(error => {
                console.error("Retranslation failed:", error);
                displayRetranslation(keywordText, "재번역 실패");
            });
        });

        keywordRow.appendChild(keywordText);
        keywordRow.appendChild(retranslateButton);
        keywordList.appendChild(keywordRow);
    });

    const closeButton = document.createElement("button");
    closeButton.textContent = "닫기";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.padding = "5px 10px";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "5px";
    closeButton.style.backgroundColor = "#ff5c5c";
    closeButton.style.color = "#fff";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener("click", () => {
        panel.remove();
    });

    panel.appendChild(closeButton);
    panel.appendChild(titleContainer); // 제목 추가
    panel.appendChild(originalTitle);
    panel.appendChild(originalParagraph);
    panel.appendChild(resutlTitle);
    panel.appendChild(result);
    panel.appendChild(keywordList);

    document.body.appendChild(panel);
}

// 재번역 결과 표시 함수 복사
function displayRetranslation(keywordElement, retranslatedWord) {
    const parentElement = keywordElement.parentElement;

    const existingResult = parentElement.nextElementSibling;
    if (existingResult && existingResult.classList.contains("retranslation-result")) {
        existingResult.remove();
    }

    const retranslationResult = document.createElement("div");
    retranslationResult.className = "retranslation-result";
    retranslationResult.style.marginTop = "5px";
    retranslationResult.style.padding = "5px 10px";
    retranslationResult.style.color = "#333";
    retranslationResult.style.fontSize = "14px";
    retranslationResult.style.fontStyle = "italic";
    retranslationResult.style.borderLeft = "4px solid #007bff";
    retranslationResult.style.backgroundColor = "#f9f9f9";
    retranslationResult.textContent = `${retranslatedWord}`;

    parentElement.parentElement.insertBefore(retranslationResult, parentElement.nextSibling);
}

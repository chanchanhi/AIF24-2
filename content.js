// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateSelection') {
        let selectedText = window.getSelection().toString();

        // 선택된 텍스트가 없는 경우
        if (!selectedText) {
            alert("먼저 번역할 텍스트를 선택하세요.");
            sendResponse({ success: false });
            return;
        }

        // 고정된 프롬프트
        let userPrompt = `너는 이제부터 한국어의 신조어는 표준어로, 
        상식 수준 이상의 고난이도 한자어 및 전문 용어는 쉬운 표현으로 번역해주는 번역가야. 
        '입력'을 바탕으로 '업무'를 수행한 후 '출력'에서 명세한 형식에 맞춰 결과를 반환해. 아래 유의사항 또한 숙지하도록 해.
        '입력'과 '업무'의 내용은 출력하지 않아야 해.
        
        입력 : ${selectedText}

        업무 : 아래 단계를 통해 입력으로부터 신조어나 고난이도 한자어, 전문 용어를 탐지한 후 번역. 
        1. 문장에서 신조어, 고난이도 한자어, 전문 용어를 탐지해 굵은 글씨로 표시
        2-1. 검출한 신조어 표현 번역: 반드시 인터넷 검색을 통해 신조어 의미 파악 후, 표준어 표현으로 순화.
        2-2. 검출한 한자어, 전문 용어 표현 번역: 쉬운 표현으로 순화
        
        출력 : 번역 결과 문장만을 출력, 순화한 표현은 굵은 글씨

        유의 사항: 
        - 모두가 알 만한 쉬운 한자어는 번역 대상에서 제외
        - 신조어 번역 전 최대한 신뢰할 수 있는 정보를 주기 위해 무조건 인터넷 검색을 먼저 수행 후, 해당 자료 기반으로 번역 수행. 알고 있는 신조어여도 인터넷 검색을 통해 신조어의 의미 파악.
        - 제시한 출력 형태 이외의 문장을 출력하지 않아야 함. 중괄호는 제외.        
        `;

        // 번역 요청
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
            displayInSidePanel(translatedText);
        })
        .catch(error => {
            console.error("Translation failed:", error);
            displayInSidePanel("번역 중 오류가 발생했습니다.");
        });

        sendResponse({ success: true });
        return true;
    }
});

// 사이드 패널 생성 및 결과 표시 함수
function displayInSidePanel(translatedText) {
    // 기존 사이드 패널이 있는 경우 제거
    const existingPanel = document.getElementById("translationSidePanel");
    if (existingPanel) {
        existingPanel.remove();
    }

    // 사이드 패널 생성
    const panel = document.createElement("div");
    panel.id = "translationSidePanel";
    panel.style.position = "fixed";
    panel.style.top = "0";
    panel.style.right = "0";
    panel.style.width = "300px";
    panel.style.height = "100%";
    panel.style.backgroundColor = "#f0f0f0";
    panel.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.2)";
    panel.style.padding = "20px";
    panel.style.overflowY = "auto";
    panel.style.zIndex = "10000";


    // 번역 결과 표시
    const title = document.createElement("h2");
    title.textContent = "번역 결과";
    title.style.marginBottom = "10px";

    const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    const result = document.createElement("p");
    result.innerHTML = formattedText;  // innerHTML을 사용해 HTML 태그를 적용
    result.style.whiteSpace = "pre-wrap";

    // 닫기 버튼 추가
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

    // 사이드 패널에 요소 추가
    panel.appendChild(closeButton);
    panel.appendChild(title);
    panel.appendChild(result);

    // 문서에 사이드 패널 추가
    document.body.appendChild(panel);
}

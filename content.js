// 메시지 리스너: 스크립트 간 메시지 교환을 위해 사용하는 크롬 API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'translateSelection') {
      let selectedText = window.getSelection().toString();

      // 선택된 텍스트가 없는 경우
      if (!selectedText) {
          alert("먼저 번역할 텍스트를 선택하세요.");
          sendResponse({ success: false });
          return;
      }

      // 번역 요청
      fetch('http://127.0.0.1:8000/translate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: selectedText })
      })
      .then(response => response.json()) // JSON 데이터를 js 객체로 변환
      .then(data => {
          let translatedText = data.translated_text;
          displayInSidePanel(translatedText, selectedText);
      })
      .catch(error => {
          console.error("Translation failed:", error);
          displayInSidePanel("번역 중 오류가 발생했습니다.");
      });

      sendResponse({ success: true });
      return true;
  }
    // 추가된 메시지 리스너: 팝업에서 보낸 메시지 처리
    if (request.action === "displayInSidePanel") {
    const { originalText, translatedText } = request;

    // 사이드 패널 표시 함수 호출
    displayInSidePanel(translatedText, originalText);

    sendResponse({ success: true });
    return true;
    }
});

// 사이드 패널 생성 및 결과 표시 함수
function displayInSidePanel(translatedText, originalText) {
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
    subtitle.style.fontSize = "0.7em";
    subtitle.style.fontWeight = "normal";
    subtitle.style.fontStyle = "italic";
    subtitle.style.color = "#999";
    subtitle.style.whiteSpace = "nowrap"; // 줄바꿈 방지
    subtitle.textContent = "신조어, 한자어, 전문 용어 해설 도구";

    title.appendChild(subtitle);
    titleContainer.appendChild(title);

  // 원문 표시
  const originalTitle = document.createElement("h2");
  originalTitle.textContent = "번역 원문";
  originalTitle.style.marginBottom = "10px";

  // 번역 원문 텍스트 추가
  const originalParagraph = document.createElement("p");
  originalParagraph.textContent = originalText;
  originalParagraph.style.whiteSpace = "pre-wrap";
  originalParagraph.style.marginBottom = "20px";

  // 번역 결과 제목 추가
  const resutlTitle = document.createElement("h2");
  resutlTitle.textContent = "번역 결과";
  resutlTitle.style.marginBottom = "10px";

  // 번역된 텍스트 표시
  const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const result = document.createElement("p");
  result.innerHTML = formattedText;
  result.style.whiteSpace = "pre-wrap";

  // 키워드 추출
  const keywords = [...translatedText.matchAll(/\*\*(.*?)\*\*/g)].map(match => match[1]);

  // 키워드 목록 생성
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

      // 재번역 버튼 클릭 이벤트
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
  panel.appendChild(titleContainer); // 제목 추가
  panel.appendChild(originalTitle);
  panel.appendChild(originalParagraph);
  panel.appendChild(resultTitle);
  panel.appendChild(result);
  panel.appendChild(keywordList);

  // 문서에 사이드 패널 추가
  document.body.appendChild(panel);

}

// 재번역 결과 표시 함수
function displayRetranslation(keywordElement, retranslatedWord) {

  // 부모 요소 찾기
  const parentElement = keywordElement.parentElement;

  // 기존에 재번역 결과가 이미 표시되어 있다면 제거
  const existingResult = parentElement.nextElementSibling;
  if (existingResult && existingResult.classList.contains("retranslation-result")) {
      existingResult.remove();
  }

  const retranslationResult = document.createElement("div");
  retranslationResult.className = "retranslation-result"; // 클래스 추가
  retranslationResult.style.marginTop = "5px";
  retranslationResult.style.padding = "5px 10px";
  retranslationResult.style.color = "#333";
  retranslationResult.style.fontSize = "14px";
  retranslationResult.style.fontStyle = "italic";
  retranslationResult.style.borderLeft = "4px solid #007bff";
  retranslationResult.style.backgroundColor = "#f9f9f9";
  retranslationResult.textContent = `${retranslatedWord}`;

  // 재번역 결과를 "단어와 버튼" 행 바로 아래에 추가
  parentElement.parentElement.insertBefore(retranslationResult, parentElement.nextSibling);
}


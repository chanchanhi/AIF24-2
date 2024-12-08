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
  panel.style.resize = "horizontal";//추가
  panel.style.overflow = "hidden";//추가

   // 드래그 핸들 추가
   const resizeHandle = document.createElement("div");
   resizeHandle.style.cssText = `
       position: absolute;
       top: 0;
       left: -5px;
       width: 10px;
       height: 100%;
       cursor: ew-resize;
       z-index: 10001;
       background-color: transparent;
   `;

   // 드래그 이벤트 추가
   let isResizing = false;

   resizeHandle.addEventListener("mousedown", (e) => {
       isResizing = true;
       document.body.style.cursor = "ew-resize";
   });

   document.addEventListener("mousemove", (e) => {
       if (isResizing) {
           const newWidth = window.innerWidth - e.clientX;
           if (newWidth > 200 && newWidth < 600) { // 최소, 최대 폭 설정
               panel.style.width = `${newWidth}px`;
           }
       }
   });

   document.addEventListener("mouseup", () => {
       if (isResizing) {
           isResizing = false;
           document.body.style.cursor = "default";
       }
   });

  // 원문 표시
  const originalTitle = document.createElement("h2");
  originalTitle.textContent = "번역 원문";
  originalTitle.style.marginBottom = "10px";

  // 번역 원문 텍스트 추가
  const originalParagraph = document.createElement("p");
  originalParagraph.textContent = originalText;
  originalParagraph.style.whiteSpace = "pre-wrap";
  originalParagraph.style.marginBottom = "20px";

  // 번역 결과 제목, 복사 버튼, 저장 버튼
  const titleContainer = document.createElement("div");
  titleContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  `;

  // 번역 결과 제목 추가
  const title = document.createElement("h2");
  title.textContent = "번역 결과";
  title.style.marginBottom = "10px";

  const copyButton = document.createElement("button");
  copyButton.textContent = "복사하기";
  copyButton.style.cssText = `
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(translatedText).then(() => {
          alert("번역 결과가 클립보드에 복사되었습니다!");
      });
  });
  //저장하기
  const saveButton = document.createElement("button");
  saveButton.textContent = "저장하기";
  saveButton.style.cssText = `
    padding: 5px 10px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  saveButton.addEventListener("click", () => {
      saveToLocalStorage(originalText, translatedText);//로컬 스토리지 저장
      alert("번역 원문과 결과가 저장되었습니다!");
      //displaySavedTranslations();//테이블 업데이트(삭제하기)
  });

  titleContainer.appendChild(title);
  titleContainer.appendChild(copyButton);
  titleContainer.appendChild(saveButton);//저장하기

  // 번역된 텍스트 표시
  const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const result = document.createElement("p");
  result.innerHTML = formattedText;
  result.style.whiteSpace = "pre-wrap";
  result.style.marginBottom = "20px";

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
  panel.appendChild(resizeHandle);//드래그 핸들 추가
  panel.appendChild(closeButton);
  panel.appendChild(originalTitle);
  panel.appendChild(originalParagraph);
  panel.appendChild(titleContainer);
  panel.appendChild(result);
  //panel.appendChild(title);
  panel.appendChild(result);
  panel.appendChild(keywordList);
  panel.appendChild(saveButton); //저장버튼

  displaySavedTranslationsInSidePanel(panel);


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

// 로컬 스토리지에 번역 데이터 저장
function saveToLocalStorage(originalText, translatedText) {
  const storedTranslations = JSON.parse(localStorage.getItem("translations")) || {};
  storedTranslations[originalText] = translatedText;
  localStorage.setItem("translations", JSON.stringify(storedTranslations));
}

// 저장된 번역 데이터를 "저장된 번역 관리" 섹션으로 표시
function displaySavedTranslationsInSidePanel(panel) {
  // 기존 "저장된 번역 관리" 섹션 제거
  const existingSection = document.getElementById("savedTranslationsSection");
  if (existingSection) {
      existingSection.remove();
  }

  // 새 컨테이너 생성
  const savedTranslationsSection = document.createElement("div");
  savedTranslationsSection.id = "savedTranslationsSection";
  savedTranslationsSection.style.marginTop = "20px";

  const title = document.createElement("h3");
  title.textContent = "저장된 번역 관리";
  savedTranslationsSection.appendChild(title);

  // 저장된 번역 데이터를 테이블 형식으로 표시
  const storedTranslations = JSON.parse(localStorage.getItem("translations")) || {};
  if (Object.keys(storedTranslations).length === 0) {
      const noDataMessage = document.createElement("p");
      noDataMessage.textContent = "저장된 번역이 없습니다.";
      noDataMessage.style.color = "#666";
      savedTranslationsSection.appendChild(noDataMessage);
  } else {
      const table = document.createElement("table");
      table.style.cssText = `
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
      `;

      const headerRow = document.createElement("tr");
      ["번역 원문", "번역 결과"].forEach(headerText => {
          const th = document.createElement("th");
          th.textContent = headerText;
          th.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
              background-color: #f1f1f1;
          `;
          headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      Object.entries(storedTranslations).forEach(([originalText, translatedText]) => {
          const row = document.createElement("tr");

          const originalCell = document.createElement("td");
          originalCell.textContent = originalText;
          originalCell.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
          `;

          const translatedCell = document.createElement("td");
          translatedCell.textContent = translatedText;
          translatedCell.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
          `;

          row.appendChild(originalCell);
          row.appendChild(translatedCell);
          table.appendChild(row);
      });

      savedTranslationsSection.appendChild(table);
  }

  // 기존 패널에 추가
  panel.appendChild(savedTranslationsSection);
}

// 초기화: 페이지 로드 시 저장된 번역 UI 표시
function initialize() {
  displaySavedTranslationsInSidePanel();
}

// 페이지 로드 시 초기화
window.onload = initialize;


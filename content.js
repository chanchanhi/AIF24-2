// 메시지 리스너: 스크립트 간 메시지 교환을 위해 사용하는 크롬 API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translateSelection") {
      let selectedText = window.getSelection().toString();

      // 선택된 텍스트가 없는 경우
      if (!selectedText) {
          alert("먼저 번역할 텍스트를 선택하세요.");
          sendResponse({ success: false });
          return;
      }

      // 번역 요청
      fetch("http://127.0.0.1:8000/translate", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: selectedText }),
      })
          .then((response) => response.json()) // JSON 데이터를 js 객체로 변환
          .then((data) => {
              let translatedText = data.translated_text;
              displayInSidePanel(translatedText, selectedText);
          })
          .catch((error) => {
              console.error("Translation failed:", error);
              displayInSidePanel("번역 중 오류가 발생했습니다.");
          });

      sendResponse({ success: true });
      return true;
  }

  if (request.action === "displayInSidePanel") {
      const { originalText, translatedText } = request;
      displayInSidePanel(translatedText, originalText);
      sendResponse({ success: true });
  }
});

// 사이드 패널 생성 및 결과 표시 함수
function displayInSidePanel(translatedText, originalText) {
  const existingPanel = document.getElementById("translationSidePanel");
  if (existingPanel) {
      existingPanel.remove();
  }

  const panel = document.createElement("div");
  panel.id = "translationSidePanel";
  panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100%;
      background-color: #f9f9f9;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      padding: 20px;
      overflow-y: auto;
      z-index: 10000;
  `;

  // 제목 및 부제 생성
  const titleContainer = document.createElement("div");
  titleContainer.className = "six";
  titleContainer.style.textAlign = "center";
  titleContainer.style.marginBottom = "20px";

  const title = document.createElement("h1");
  title.style.color = "#c50000";
  title.style.fontSize = "24px";
  //title.style.textTransform = "uppercase";
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
  const originalTitle = document.createElement("h3");
  originalTitle.textContent = "드래그한 원문";
  originalTitle.style.marginBottom = "10px";

  const originalTextParagraph = document.createElement("p");
  originalTextParagraph.textContent = originalText;
  originalTextParagraph.style.cssText = `
      white-space: pre-wrap;
      background-color: #f1f1f1;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
  `;

  // 번역 결과 제목, 복사 및 저장 버튼 생성
  const resultHeaderContainer = document.createElement("div");
  resultHeaderContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
  `;

  const resultTitle = document.createElement("h2");
  resultTitle.textContent = "해설";
  resultTitle.style.marginBottom = "10px";

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
      saveToLocalStorage(originalText, translatedText);
      // 테이블 즉시 업데이트
      displaySavedTranslationsInSidePanel(panel);
      alert("드래그한 원문과 결과가 저장되었습니다!");
  });

  resultHeaderContainer.appendChild(resultTitle);
  resultHeaderContainer.appendChild(copyButton);
  resultHeaderContainer.appendChild(saveButton);

  // 번역된 텍스트 표시
  const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const result = document.createElement("p");
  result.innerHTML = formattedText;
  result.style.whiteSpace = "pre-wrap";
  result.style.marginBottom = "20px";

  // 키워드 목록 생성
  const keywordList = document.createElement("div");
  keywordList.style.marginTop = "20px";

  const keywordTitle = document.createElement("h3");
  keywordTitle.textContent = "변환된 단어 목록";
  keywordList.appendChild(keywordTitle);

  const keywords = [...translatedText.matchAll(/\*\*(.*?)\*\*/g)].map((match) => match[1]);
  keywords.forEach((keyword) => {
      const keywordRow = document.createElement("div");
      keywordRow.style.display = "flex";
      keywordRow.style.justifyContent = "space-between";
      keywordRow.style.marginBottom = "10px";
      keywordRow.style.alignItems = "center";

      const keywordText = document.createElement("span");
      keywordText.textContent = keyword;

      const retranslateButton = document.createElement("button");
      retranslateButton.textContent = "재해설";
      retranslateButton.style.padding = "5px 10px";
      retranslateButton.style.border = "none";
      retranslateButton.style.borderRadius = "5px";
      retranslateButton.style.backgroundColor = "#007bff";
      retranslateButton.style.color = "#fff";
      retranslateButton.style.cursor = "pointer";

      retranslateButton.addEventListener("click", () => {
          fetch("http://127.0.0.1:8000/retranslate", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ word: keyword }),
          })
              .then((response) => response.json())
              .then((data) => {
                  const retranslatedWord = data.retranslated_word;
                  displayRetranslation(keywordText, retranslatedWord);
              })
              .catch((error) => {
                  console.error("Retranslation failed:", error);
                  displayRetranslation(keywordText, "재해설 실패");
              });
      });

      keywordRow.appendChild(keywordText);
      keywordRow.appendChild(retranslateButton);
      keywordList.appendChild(keywordRow);
  });

  // 닫기 버튼 생성
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

  // 패널에 요소 추가
  panel.appendChild(closeButton);
  panel.appendChild(titleContainer);
  panel.appendChild(originalTitle);
  panel.appendChild(originalTextParagraph);
  panel.appendChild(resultHeaderContainer);
  panel.appendChild(result);
  panel.appendChild(keywordList);

  // 저장된 번역 데이터 추가
  displaySavedTranslationsInSidePanel(panel);

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
// **을 <strong> 태그로 변환
const formattedText = translatedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

// 로컬 스토리지에 저장
const storedTranslations = JSON.parse(localStorage.getItem("translations")) || {};
storedTranslations[originalText] = formattedText; // 변환된 텍스트 저장
localStorage.setItem("translations", JSON.stringify(storedTranslations));
}

// 로컬 스토리지에서 번역 데이터 삭제
function deleteFromLocalStorage(originalText) {
const storedTranslations = JSON.parse(localStorage.getItem("translations")) || {};
if (originalText in storedTranslations) {
    delete storedTranslations[originalText];
    localStorage.setItem("translations", JSON.stringify(storedTranslations));
}
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
title.textContent = "저장된 표현 관리";
savedTranslationsSection.appendChild(title);

// 저장된 번역 데이터를 테이블 형식으로 표시
const storedTranslations = JSON.parse(localStorage.getItem("translations")) || {};
if (Object.keys(storedTranslations).length === 0) {
    const noDataMessage = document.createElement("p");
    noDataMessage.textContent = "저장된 해설이 없습니다.";
    noDataMessage.style.color = "#666";
    savedTranslationsSection.appendChild(noDataMessage);
} else {
    const table = document.createElement("table");
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        table-layout: fixed; /* 고정된 열 너비 */
    `;

    const headerRow = document.createElement("tr");
      ["원문", "해설", "삭제"].forEach((headerText) => {
          const th = document.createElement("th");
          th.textContent = headerText;
          th.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
              background-color: #f1f1f1;
              text-align: center;
              word-wrap: break-word; /* 긴 텍스트 줄바꿈 */
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
              word-wrap: break-word; /* 긴 텍스트 줄바꿈 */
              overflow: hidden;
              text-overflow: ellipsis;
          `;

          const translatedCell = document.createElement("td");
          translatedCell.innerHTML = translatedText;
          translatedCell.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
              word-wrap: break-word; /* 긴 텍스트 줄바꿈 */
              overflow: hidden;
              text-overflow: ellipsis;
          `;

          const deleteCell = document.createElement("td");
          deleteCell.style.cssText = `
              padding: 5px;
              border: 1px solid #ddd;
              text-align: center;
          `;

          const deleteButton = document.createElement("button");
          deleteButton.textContent = "삭제";
          deleteButton.style.cssText = `
              padding: 5px 10px;
              background-color: #dc3545;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
          `;
          deleteButton.addEventListener("click", () => {
              deleteFromLocalStorage(originalText);
              displaySavedTranslationsInSidePanel(panel); // 삭제 후 업데이트
          });

          deleteCell.appendChild(deleteButton);

          row.appendChild(originalCell);
          row.appendChild(translatedCell);
          row.appendChild(deleteCell);

          table.appendChild(row);
      });

      savedTranslationsSection.appendChild(table);
  }

  panel.appendChild(savedTranslationsSection);
}

// 번역 패널 생성
function createTranslationPanel() {
const panel = document.createElement("div");
panel.id = "translationSidePanel";
panel.style.cssText = `
    position: fixed;
    top: 0;
    right: -350px;
    width: 350px;
    height: 100%;
    background-color: #f9f9f9;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    padding: 20px;
    overflow-y: auto;
    z-index: 10000;
`;
return panel;
}

// 초기화: 페이지 로드 시 저장된 번역 UI 표시(사이드바 수정)
function initialize() {
const panel = createTranslationPanel();
document.body.appendChild(panel);
//displaySavedTranslationsInSidePanel(panel);
}

// 페이지 로드 시 초기화
window.onload = initialize;


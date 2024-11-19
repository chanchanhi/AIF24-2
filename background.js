// 확장 프로그램 설치 시 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translateText',
    title: '번역하기',
    contexts: ['selection'], // 텍스트를 선택한 경우에만 표시
  });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translateText') {
    // 먼저 content.js가 로드되었는지 확인 후 메시지 전송
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['content.js'], // content.js를 강제로 주입
      },
      () => {
        // 주입 후 메시지 전송
        chrome.tabs.sendMessage(tab.id, { action: 'translateSelection' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to send message:', chrome.runtime.lastError.message);
          }
        });
      }
    );
  }
});

  
  
  
  
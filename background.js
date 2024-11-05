
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translateText',
    title: '번역하기',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
if (info.menuItemId === 'translateText') {
    chrome.tabs.sendMessage(tab.id, { action: 'translateSelection' }, (response) => {
      // 추가  
      if (chrome.runtime.lastError) {
            console.error("Failed to send message:", chrome.runtime.lastError.message);
        }
    });
}
});
  
  
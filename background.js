
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'translateText',
      title: '번역하기',
      contexts: ['selection']
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translateText') {
      chrome.tabs.sendMessage(tab.id, { action: 'translateSelection' });
    }
  });
  
  
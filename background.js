// Background service worker for Multi-AI Chat Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Multi-AI Chat Extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newMessage') {
    // Forward message to all tabs running the chatroom
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('multi_ai_chatroom')) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Tab might not have the listener, ignore errors
          });
        }
      });
    });
  }
  
  if (message.type === 'sendToAI') {
    // Broadcast to all AI platform tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (
          tab.url.includes('chat.deepseek.com') ||
          tab.url.includes('claude.ai') ||
          tab.url.includes('chat.openai.com') ||
          tab.url.includes('grok.com')
        )) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Tab might not have the listener, ignore errors
          });
        }
      });
    });
  }
});
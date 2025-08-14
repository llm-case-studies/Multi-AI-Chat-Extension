
let messageQueue = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newMessage') {
    messageQueue.push({ ...message.payload, received: new Date().toISOString() });
    messageQueue.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    chrome.tabs.query({ url: 'http://localhost:3000/chatroom' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'newMessage', payload: message.payload });
      }
    });
  } else if (message.type === 'sendToAI') {
    chrome.runtime.sendMessage(message);
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'http://localhost:3000/chatroom' });
});

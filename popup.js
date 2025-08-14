// Popup script for Multi-AI Chat Extension

document.addEventListener('DOMContentLoaded', () => {
  // Check webhook status
  chrome.storage.sync.get('webhookUrl', (data) => {
    const statusDiv = document.getElementById('webhookStatus');
    if (data.webhookUrl && data.webhookUrl.trim() !== '') {
      statusDiv.textContent = `Webhook: ${data.webhookUrl}`;
      statusDiv.className = 'status active';
    } else {
      statusDiv.textContent = 'Webhook: Not configured';
      statusDiv.className = 'status inactive';
    }
  });

  // Send to All AIs button
  document.getElementById('sendToAll').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value.trim();
    if (message) {
      chrome.runtime.sendMessage({
        type: 'sendToAI',
        target: 'All',
        content: message
      });
      document.getElementById('messageInput').value = '';
      window.close();
    }
  });

  // Open Chatroom button
  document.getElementById('openChatroom').addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('multi_ai_chatroom_html.html')
    });
  });

  // Open Options button
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Enter key support for message input
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('sendToAll').click();
    }
  });
});
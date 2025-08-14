
let observer;
const platform = "Claude";
const threadId = crypto.randomUUID();

chrome.storage.sync.get('webhookUrl', (data) => {
  const webhookUrl = data.webhookUrl || 'http://localhost:8000/webhook';
  const chatContainer = document.querySelector('.chat-container');
  if (!chatContainer) {
    console.log('Chat container not found. Update .chat-container selector in claude_chat.js.');
    return;
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            let role = '';
            let content = node.innerText.trim();

            if (node.classList.contains('user-message')) {
              role = 'user';
            } else if (node.classList.contains('assistant-message')) {
              role = 'assistant';
            }

            if (role && content) {
              const payload = { platform, role, content, thread_id: threadId, timestamp: new Date().toISOString() };
              fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              })
                .then(response => {
                  if (!response.ok) throw new Error('Webhook response not OK');
                  console.log(`[${platform}] Sent ${role} message: ${content.substring(0, 50)}...`);
                  chrome.runtime.sendMessage({ type: 'newMessage', payload });
                })
                .catch(err => console.error(`[${platform}] Error sending to webhook:`, err));
            }
          }
        });
      }
    });
  });

  observer.observe(chatContainer, { childList: true, subtree: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sendToAI' && (message.target === 'Claude' || message.target === 'All')) {
    const input = document.querySelector('.chat-input');
    if (input) {
      input.value = message.content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const sendButton = document.querySelector('.send-button');
      if (sendButton) sendButton.click();
    }
  }
});

window.addEventListener('beforeunload', () => {
  if (observer) observer.disconnect();
});

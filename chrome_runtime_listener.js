
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'newMessage') {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.payload.role}`;
    messageDiv.innerHTML = `<span class="platform">[${message.payload.platform}]</span> <strong>${message.payload.role}:</strong> ${message.payload.content}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});

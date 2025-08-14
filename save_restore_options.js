
function save_options() {
  const webhookUrl = document.getElementById('webhookUrl').value;
  chrome.storage.sync.set({ webhookUrl }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => { status.textContent = ''; }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({ webhookUrl: 'http://localhost:8000/webhook' }, (items) => {
    document.getElementById('webhookUrl').value = items.webhookUrl;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

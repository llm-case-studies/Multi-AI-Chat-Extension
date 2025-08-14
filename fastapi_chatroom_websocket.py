
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import json

app = FastAPI()
messages = []

@app.post("/webhook")
async def webhook(payload: dict):
    messages.append(payload)
    for ws in active_websockets:
        await ws.send_json(payload)
    return {"status": "received"}

active_websockets = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        for msg in messages:
            await websocket.send_json(msg)
        while True:
            await websocket.receive_text()
    except:
        active_websockets.remove(websocket)

@app.get("/chatroom")
async def chatroom():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Multi-AI Chatroom</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        #messages { max-height: 600px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; }
        .message { margin: 5px 0; padding: 5px; border-radius: 5px; }
        .user { background: #e0f7fa; }
        .assistant { background: #f0f0f0; }
        .platform { font-weight: bold; color: #555; }
        #input { width: 80%; padding: 5px; }
        #target { width: 15%; padding: 5px; }
      </style>
    </head>
    <body>
      <h2>Multi-AI Chatroom</h2>
      <div id="messages"></div>
      <select id="target">
        <option value="All">All AIs</option>
        <option value="DeepSeek">DeepSeek</option>
        <option value="Grok">Grok</option>
        <option value="GPT-5">GPT-5</option>
        <option value="Claude">Claude</option>
      </select>
      <input id="input" placeholder="Type message (@AI to address specific AI)">
      <button onclick="sendMessage()">Send</button>
      <script>
        const ws = new WebSocket('ws://localhost:8000/ws');
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          const messagesDiv = document.getElementById('messages');
          const messageDiv = document.createElement('div');
          messageDiv.className = `message ${msg.role}`;
          messageDiv.innerHTML = `<span class="platform">[${msg.platform}]</span> <strong>${msg.role}:</strong> ${msg.content}`;
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };
        function sendMessage() {
          const input = document.getElementById('input');
          const target = document.getElementById('target').value;
          const content = input.value;
          if (content) {
            chrome.runtime.sendMessage({ type: 'sendToAI', target, content });
            input.value = '';
          }
        }
      </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

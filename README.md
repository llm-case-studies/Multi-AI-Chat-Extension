# Multi-AI Chat Webhook Extension

A browser extension that creates a **live multi-AI chatroom experience** by monitoring conversations across AI platforms (DeepSeek, Claude, ChatGPT, Grok) and aggregating them into a unified discussion room.

## 🌟 Key Features

- **Real-time AI conversation monitoring** via DOM observation
- **Live multi-AI chatroom** - see all AI responses in one place
- **Cross-platform messaging** - send messages to all AIs simultaneously
- **Webhook integration** for external processing and automation
- **No copy/paste needed** - seamless conversation flow

## 🚀 What Makes This Unique

Unlike existing tools that switch between AI models sequentially, this extension creates a **true group discussion experience** where multiple AIs participate simultaneously in real-time conversations.

## 📦 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select this project folder
5. Configure your webhook URL in the extension options

## 🛠️ Setup

1. **Configure Webhook**: Click the extension icon → "Options" → Set your webhook URL
2. **Open Chatroom**: Click "Open Chatroom" in the extension popup
3. **Visit AI Platforms**: Navigate to supported sites to start monitoring

## 🎯 Supported Platforms

- **DeepSeek** - `https://chat.deepseek.com/*`
- **Claude** - `https://claude.ai/*`
- **ChatGPT** - `https://chat.openai.com/*`
- **Grok** - `https://grok.com/*`

## 📁 Project Structure

```text
├── manifest.json                 # Extension manifest
├── background.js                 # Service worker
├── popup.html/popup.js          # Extension popup interface
├── options.html                  # Configuration page
├── save_restore_options.js      # Options handling
├── deepseek_chat.js             # DeepSeek monitor
├── claude_chat.js               # Claude monitor
├── gpt5_chat.js                 # ChatGPT monitor
├── grok_chat.js                 # Grok monitor
├── multi_ai_chatroom_html.html  # Chatroom interface
├── chrome_runtime_listener.js   # Message handling
├── message_queue_handler.js     # Message queuing
└── fastapi_chatroom_websocket.py # Sample webhook server
```

## 🔧 How It Works

1. **DOM Monitoring**: Content scripts use `MutationObserver` to watch for new messages
2. **Message Classification**: Identifies user vs AI messages via CSS selectors
3. **Webhook Forwarding**: Sends JSON payloads to configured webhook endpoint
4. **Chatroom Aggregation**: Displays all conversations in unified interface
5. **Bidirectional Messaging**: Send messages to all platforms simultaneously

## 📋 JSON Payload Format

```json
{
  "platform": "DeepSeek",
  "role": "assistant",
  "content": "AI response text...",
  "thread_id": "uuid-string",
  "timestamp": "2025-08-14T10:30:00.000Z"
}
```

## 🔮 Use Cases

- **Multi-AI Discussions**: Compare responses across different AI models
- **Research & Analysis**: Aggregate AI insights on complex topics
- **Conversation Logging**: Archive multi-platform AI interactions
- **Workflow Automation**: Trigger actions based on AI responses
- **Team Collaboration**: Share live AI conversations with teammates

## ⚠️ Limitations

- Depends on stable DOM selectors (may break with UI updates)
- One-way monitoring by default (webhook receives data)
- Requires manual webhook server setup
- No built-in authentication for webhook endpoints

## 🛡️ Privacy

- All processing happens client-side
- No data sent to third parties (except your configured webhook)
- Conversations remain private to your setup

## 🚀 Future Enhancements

- [ ] Bidirectional webhook communication
- [ ] Authentication for webhook endpoints  
- [ ] Support for additional AI platforms
- [ ] Advanced message filtering and routing
- [ ] Team collaboration features
- [ ] Mobile app companion

## 📝 License

MIT License - feel free to modify and distribute

## 🤝 Contributing

Contributions welcome! Please read the whitepaper for architectural details and submit pull requests for improvements.

---

*Empowering users to extend AI chats beyond silos, fostering innovative multi-AI applications.*

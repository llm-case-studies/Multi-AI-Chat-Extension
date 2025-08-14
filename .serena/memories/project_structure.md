# Project Structure

## Core Files
- `multi_ai_chatroom_extension_manifest.json` - Extension manifest (needs rename)
- `options.html` - Configuration UI (corrupted, needs fix)
- `save_restore_options.js` - Options page JavaScript

## Content Scripts (Observer Pattern)
- `deepseek_chat_observer.js` - DeepSeek chat monitoring
- `claude_chat_observer.js` - Claude chat monitoring  
- `gpt_5_chat_observer.js` - ChatGPT monitoring
- `grok_chat_observer.js` - Grok monitoring

## Supporting Files
- `chrome_runtime_listener.js` - Message handling
- `message_queue_handler.js` - Message queuing
- `multi_ai_chatroom_html.html` - Chatroom UI
- `multi_ai_chatroom_options.html` - Additional options
- `fastapi_chatroom_websocket.py` - Server-side webhook handler

## Missing Files (Based on manifest.json references)
- `popup.html` - Extension popup UI
- `background.js` - Service worker
- `options.js` - Options page script
- Renamed content scripts to match manifest expectations
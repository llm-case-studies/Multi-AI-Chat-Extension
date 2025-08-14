# Multi-AI Chat Webhook Extension

## Purpose
A browser extension designed to monitor AI chat interfaces (DeepSeek, Claude, ChatGPT, Grok) and forward conversation data to webhooks for aggregation, logging, and multi-AI integration.

## Architecture
- **Manifest v3 Chrome extension**
- **Content scripts** for each AI platform that use MutationObserver to watch DOM changes
- **Options page** for webhook URL configuration
- **Background service worker** for message coordination
- **Popup interface** for user interaction

## Key Features
- Real-time conversation monitoring via DOM observation
- Webhook-based data forwarding with JSON payloads
- Multi-platform support (DeepSeek, Claude, ChatGPT, Grok)
- Bidirectional messaging support
- Local chatroom aggregation

## Tech Stack
- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (storage, activeTab, tabs, runtime)
- DOM MutationObserver API
- Fetch API for webhook communication
- JSON for data serialization
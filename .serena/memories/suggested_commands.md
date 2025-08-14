# Suggested Commands

## Browser Extension Development
- Load extension in Chrome: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked"
- Reload extension: Click reload button in Chrome extensions page
- Debug content scripts: Open DevTools on target AI website, check Console tab
- Debug extension: Right-click extension icon → "Inspect popup" or go to chrome://extensions and click "service worker"

## File Operations
- `ls` - List directory contents
- `cp source dest` - Copy files
- `mv source dest` - Move/rename files
- `rm filename` - Remove files
- `mkdir dirname` - Create directory

## Development Workflow
1. Make changes to extension files
2. Reload extension in Chrome
3. Test on AI platforms
4. Check console for errors
5. Verify webhook receives data

## Testing
- Test on each AI platform: DeepSeek, Claude, ChatGPT, Grok
- Verify webhook URL configuration saves properly
- Check message forwarding functionality
- Test bidirectional messaging
/**
 * Enhanced Chatroom Client for Multi-AI Chat Platform
 * Handles real-time communication, rich media, and participant management
 */

class MultiAIChatroom {
    constructor() {
        this.ws = null;
        this.sessionId = null;
        this.participantId = null;
        this.participantName = null;
        this.participants = new Map();
        this.aiPlatforms = new Map();
        this.messages = [];
        
        this.initializeDOM();
        this.setupEventListeners();
        this.initializeSession();
    }

    initializeDOM() {
        // Get DOM elements
        this.elements = {
            sessionName: document.getElementById('sessionName'),
            sessionStatus: document.getElementById('sessionStatus'),
            participantCount: document.getElementById('participantCount'),
            connectionStatus: document.getElementById('connectionStatus'),
            participantList: document.getElementById('participantList'),
            aiPlatforms: document.getElementById('aiPlatforms'),
            mediaGallery: document.getElementById('mediaGallery'),
            messagesArea: document.getElementById('messagesArea'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            mediaBtn: document.getElementById('mediaBtn'),
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput')
        };
    }

    setupEventListeners() {
        // Send message button
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter key to send message (Shift+Enter for new line)
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.elements.messageInput.style.height = 'auto';
            this.elements.messageInput.style.height = this.elements.messageInput.scrollHeight + 'px';
        });

        // Media upload button
        this.elements.mediaBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        // File input change
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop for media
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('active');
        });

        document.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget) {
                this.elements.dropZone.classList.remove('active');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('active');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Window beforeunload
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    async initializeSession() {
        // Get session info from URL params or create new session
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('sessionId') || await this.createSession();
        this.participantName = urlParams.get('name') || this.promptForName();
        this.participantId = this.generateParticipantId();

        await this.connectToSession();
    }

    generateParticipantId() {
        return 'participant_' + Math.random().toString(36).substr(2, 9);
    }

    promptForName() {
        let name = localStorage.getItem('participantName');
        if (!name) {
            name = prompt('Enter your name:') || 'Anonymous';
            localStorage.setItem('participantName', name);
        }
        return name;
    }

    async createSession() {
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    facilitatorId: 'demo_facilitator',
                    sessionName: 'Demo Multi-AI Session',
                    aiPlatforms: ['deepseek', 'claude', 'chatgpt', 'grok']
                })
            });

            const data = await response.json();
            return data.sessionId;
        } catch (error) {
            console.error('Failed to create session:', error);
            return 'demo_session_' + Date.now();
        }
    }

    async connectToSession() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to WebSocket server');
                this.updateConnectionStatus('connected');
                this.joinSession();
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            };

            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.updateConnectionStatus('disconnected');
                setTimeout(() => this.connectToSession(), 3000); // Reconnect after 3 seconds
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected');
            };

        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    joinSession() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_session',
                sessionId: this.sessionId,
                participantId: this.participantId,
                participantName: this.participantName,
                role: 'participant'
            }));
        }
    }

    handleWebSocketMessage(message) {
        console.log('Received message:', message);

        switch (message.type) {
            case 'session_joined':
                this.handleSessionJoined(message);
                break;
            case 'participant_joined':
                this.handleParticipantJoined(message);
                break;
            case 'participant_left':
                this.handleParticipantLeft(message);
                break;
            case 'new_message':
                this.handleNewMessage(message);
                break;
            case 'ai_response':
                this.handleAIResponse(message);
                break;
            case 'rich_media_shared':
                this.handleRichMediaShared(message);
                break;
            case 'participant_status_updated':
                this.handleParticipantStatusUpdated(message);
                break;
            case 'error':
                this.handleError(message);
                break;
        }
    }

    handleSessionJoined(message) {
        const { session } = message;
        
        this.elements.sessionName.textContent = session.name;
        this.updateParticipantsList(session.participants);
        this.updateAIPlatformsList(session.aiPlatforms);
        
        // Load session history if available
        if (session.messages) {
            session.messages.forEach(msg => this.displayMessage(msg));
        }
    }

    handleParticipantJoined(message) {
        const participant = message.participant;
        this.participants.set(participant.id, participant);
        this.addParticipantToList(participant);
        this.updateParticipantCount();
        
        // Show notification
        this.showNotification(`${participant.name} joined the session`);
    }

    handleParticipantLeft(message) {
        const participantId = message.participantId;
        const participant = this.participants.get(participantId);
        
        if (participant) {
            this.participants.delete(participantId);
            this.removeParticipantFromList(participantId);
            this.updateParticipantCount();
            this.showNotification(`${participant.name} left the session`);
        }
    }

    handleNewMessage(message) {
        this.displayMessage(message.message);
    }

    handleAIResponse(message) {
        this.displayMessage(message.message);
    }

    handleRichMediaShared(message) {
        this.displayRichMedia(message.media);
    }

    handleParticipantStatusUpdated(message) {
        const participant = this.participants.get(message.participantId);
        if (participant) {
            participant.status = message.status;
            this.updateParticipantInList(participant);
        }
    }

    handleError(message) {
        console.error('Server error:', message.message);
        this.showNotification(`Error: ${message.message}`, 'error');
    }

    sendMessage() {
        const content = this.elements.messageInput.value.trim();
        if (!content) return;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'human_message',
                sessionId: this.sessionId,
                content: content,
                richMedia: null
            }));

            // Clear input
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';
        }
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            this.processFile(file);
        });
    }

    async processFile(file) {
        const mediaType = this.getMediaType(file);
        const mediaData = await this.readFileAsDataURL(file);
        
        const metadata = {
            filename: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        };

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'rich_media',
                sessionId: this.sessionId,
                mediaType: mediaType,
                mediaData: mediaData,
                metadata: metadata
            }));
        }
    }

    getMediaType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type === 'application/json') return 'code_project';
        if (file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.md')) return 'code';
        return 'document';
    }

    readFileAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <div class="message-avatar ${message.senderType}-avatar">
                ${this.getAvatarText(message.senderName)}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.senderName}</span>
                    <span class="message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
                ${message.richMedia ? this.renderRichMedia(message.richMedia) : ''}
            </div>
        `;

        this.elements.messagesArea.appendChild(messageElement);
        this.scrollToBottom();
    }

    displayRichMedia(mediaItem) {
        // Add to media gallery
        const mediaElement = document.createElement('div');
        mediaElement.className = 'media-item';
        mediaElement.innerHTML = this.renderMediaItem(mediaItem);
        this.elements.mediaGallery.appendChild(mediaElement);

        // Also show as a message
        this.displayMessage({
            senderName: 'System',
            senderType: 'system',
            content: `${mediaItem.uploadedBy} shared ${mediaItem.type}`,
            richMedia: mediaItem,
            timestamp: mediaItem.uploadedAt
        });
    }

    renderRichMedia(richMedia) {
        if (!richMedia) return '';
        
        switch (richMedia.type) {
            case 'image':
                return `<div class="rich-media-item">
                    <img src="${richMedia.data}" alt="${richMedia.metadata.filename}" style="max-width: 100%; border-radius: 4px;">
                </div>`;
            
            case 'code_project':
                return `<div class="rich-media-item code-project">
                    <strong>📁 ${richMedia.metadata.filename}</strong><br>
                    <pre>${JSON.stringify(richMedia.data, null, 2)}</pre>
                </div>`;
            
            case 'link':
                return `<div class="rich-media-item">
                    <strong>🔗 <a href="${richMedia.url}" target="_blank">${richMedia.title}</a></strong><br>
                    <p>${richMedia.description}</p>
                </div>`;
            
            default:
                return `<div class="rich-media-item">
                    <strong>📄 ${richMedia.metadata.filename}</strong><br>
                    <small>Size: ${this.formatFileSize(richMedia.metadata.size)}</small>
                </div>`;
        }
    }

    renderMediaItem(mediaItem) {
        return `
            <div class="media-preview">
                <strong>${mediaItem.metadata.filename}</strong><br>
                <small>Uploaded by ${mediaItem.uploadedBy}</small>
            </div>
        `;
    }

    getAvatarText(name) {
        return name.substring(0, 2).toUpperCase();
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatMessageContent(content) {
        // Basic message formatting (could be enhanced with markdown support)
        return content.replace(/\n/g, '<br>');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateParticipantsList(participants) {
        participants.forEach(participant => {
            this.participants.set(participant.id, participant);
            this.addParticipantToList(participant);
        });
        this.updateParticipantCount();
    }

    addParticipantToList(participant) {
        const participantElement = document.createElement('div');
        participantElement.className = 'participant-item';
        participantElement.id = `participant-${participant.id}`;
        participantElement.innerHTML = `
            <div class="participant-avatar human-avatar">
                ${this.getAvatarText(participant.name)}
            </div>
            <div class="participant-info">
                <div class="participant-name">${participant.name}</div>
                <div class="participant-role">${participant.role}</div>
            </div>
            <div class="status-indicator"></div>
        `;
        
        this.elements.participantList.appendChild(participantElement);
    }

    removeParticipantFromList(participantId) {
        const element = document.getElementById(`participant-${participantId}`);
        if (element) {
            element.remove();
        }
    }

    updateParticipantInList(participant) {
        const element = document.getElementById(`participant-${participant.id}`);
        if (element) {
            const statusIndicator = element.querySelector('.status-indicator');
            statusIndicator.style.background = participant.status === 'active' ? '#4CAF50' : '#666';
        }
    }

    updateAIPlatformsList(platforms) {
        this.elements.aiPlatforms.innerHTML = '';
        platforms.forEach(platform => {
            const platformElement = document.createElement('div');
            platformElement.className = 'ai-platform connected';
            platformElement.innerHTML = `
                <div class="participant-avatar ai-avatar">
                    ${this.getAvatarText(platform)}
                </div>
                <div class="participant-info">
                    <div class="participant-name">${platform}</div>
                    <div class="participant-role">AI Assistant</div>
                </div>
                <div class="status-indicator"></div>
            `;
            this.elements.aiPlatforms.appendChild(platformElement);
        });
    }

    updateParticipantCount() {
        const count = this.participants.size;
        this.elements.participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
    }

    updateConnectionStatus(status) {
        const statusElement = this.elements.connectionStatus;
        statusElement.className = `connection-status ${status}`;
        
        switch (status) {
            case 'connected':
                statusElement.textContent = 'Connected';
                break;
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                break;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    scrollToBottom() {
        this.elements.messagesArea.scrollTop = this.elements.messagesArea.scrollHeight;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Initialize the chatroom when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatroom = new MultiAIChatroom();
});

// Add CSS animation for slideInRight
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
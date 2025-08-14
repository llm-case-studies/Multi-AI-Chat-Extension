/**
 * WebSocket Server for Multi-AI Chat Platform
 * Handles real-time communication between human participants and AI platforms
 */

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class MultiAIChatServer {
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.wss = null;
    
    // Session management
    this.sessions = new Map();
    this.participants = new Map();
    this.facilitators = new Map();
    
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        sessions: this.sessions.size,
        participants: this.participants.size 
      });
    });

    // Create new chat session
    this.app.post('/api/sessions', (req, res) => {
      const { facilitatorId, sessionName, aiPlatforms } = req.body;
      
      const sessionId = uuidv4();
      const session = new ChatSession(sessionId, facilitatorId, sessionName, aiPlatforms);
      
      this.sessions.set(sessionId, session);
      
      res.json({
        sessionId,
        joinUrl: `ws://localhost:${this.port}/session/${sessionId}`,
        session: session.toJSON()
      });
    });

    // Get session info
    this.app.get('/api/sessions/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session.toJSON());
    });
  }

  setupWebSocket() {
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid message format:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });
    });
  }

  handleMessage(ws, message) {
    const { type, sessionId, participantId } = message;

    switch (type) {
      case 'join_session':
        this.handleJoinSession(ws, message);
        break;
        
      case 'human_message':
        this.handleHumanMessage(ws, message);
        break;
        
      case 'ai_response':
        this.handleAIResponse(ws, message);
        break;
        
      case 'rich_media':
        this.handleRichMedia(ws, message);
        break;
        
      case 'participant_status':
        this.handleParticipantStatus(ws, message);
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }

  handleJoinSession(ws, message) {
    const { sessionId, participantId, participantName, role } = message;
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }));
      return;
    }

    const participant = new Participant(participantId, participantName, role, ws);
    session.addParticipant(participant);
    this.participants.set(participantId, participant);
    
    // Store session reference in WebSocket
    ws.sessionId = sessionId;
    ws.participantId = participantId;

    // Send session info to new participant
    ws.send(JSON.stringify({
      type: 'session_joined',
      sessionId,
      session: session.toJSON(),
      participantId
    }));

    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: 'participant_joined',
      participant: participant.toJSON()
    }, participantId);

    console.log(`Participant ${participantName} joined session ${sessionId}`);
  }

  handleHumanMessage(ws, message) {
    const { sessionId, content, richMedia } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;

    const participant = this.participants.get(ws.participantId);
    if (!participant) return;

    const chatMessage = new ChatMessage({
      id: uuidv4(),
      sessionId,
      senderId: participant.id,
      senderName: participant.name,
      senderType: 'human',
      content,
      richMedia,
      timestamp: new Date()
    });

    session.addMessage(chatMessage);

    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: 'new_message',
      message: chatMessage.toJSON()
    });

    // Forward to AI platforms via browser extension
    this.forwardToAIPlatforms(sessionId, chatMessage);
  }

  handleAIResponse(ws, message) {
    const { sessionId, platform, content, threadId } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;

    const chatMessage = new ChatMessage({
      id: uuidv4(),
      sessionId,
      senderId: platform,
      senderName: platform,
      senderType: 'ai',
      platform,
      content,
      threadId,
      timestamp: new Date()
    });

    session.addMessage(chatMessage);

    // Broadcast AI response to all participants
    this.broadcastToSession(sessionId, {
      type: 'ai_response',
      message: chatMessage.toJSON()
    });
  }

  handleRichMedia(ws, message) {
    const { sessionId, mediaType, mediaData, metadata } = message;
    const session = this.sessions.get(sessionId);
    
    if (!session) return;

    const participant = this.participants.get(ws.participantId);
    if (!participant) return;

    const mediaItem = new MediaItem({
      id: uuidv4(),
      sessionId,
      uploadedBy: participant.id,
      type: mediaType,
      data: mediaData,
      metadata,
      uploadedAt: new Date()
    });

    session.addMediaItem(mediaItem);

    // Process rich media (this would integrate with the rich media pipeline)
    this.processRichMedia(mediaItem).then(processedMedia => {
      // Broadcast processed media to all participants
      this.broadcastToSession(sessionId, {
        type: 'rich_media_shared',
        media: processedMedia.toJSON()
      });
    });
  }

  handleParticipantStatus(ws, message) {
    const { sessionId, status } = message;
    const participant = this.participants.get(ws.participantId);
    
    if (participant) {
      participant.status = status;
      
      // Broadcast status update
      this.broadcastToSession(sessionId, {
        type: 'participant_status_updated',
        participantId: participant.id,
        status
      }, participant.id);
    }
  }

  handleDisconnection(ws) {
    const participantId = ws.participantId;
    const sessionId = ws.sessionId;
    
    if (participantId && sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.removeParticipant(participantId);
        
        // Notify other participants
        this.broadcastToSession(sessionId, {
          type: 'participant_left',
          participantId
        });
      }
      
      this.participants.delete(participantId);
    }
    
    console.log(`Participant ${participantId} disconnected from session ${sessionId}`);
  }

  broadcastToSession(sessionId, message, excludeParticipantId = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants.forEach(participant => {
      if (participant.id !== excludeParticipantId && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(JSON.stringify(message));
      }
    });
  }

  forwardToAIPlatforms(sessionId, message) {
    // This would integrate with the browser extension
    // to send messages to all connected AI platforms
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Send to browser extension via webhook or WebSocket
    const aiForwardMessage = {
      type: 'forward_to_ai',
      sessionId,
      platforms: session.aiPlatforms,
      content: message.content,
      sender: message.senderName
    };

    // This would be sent to the browser extension
    console.log('Forwarding to AI platforms:', aiForwardMessage);
  }

  async processRichMedia(mediaItem) {
    // Placeholder for rich media processing pipeline
    // This would integrate with the MediaPipeline class from RICH_MEDIA_SUPPORT.md
    
    switch (mediaItem.type) {
      case 'code_project':
        return this.processCodeProject(mediaItem);
      case 'image':
        return this.processImage(mediaItem);
      case 'link':
        return this.processLink(mediaItem);
      default:
        return mediaItem;
    }
  }

  async processCodeProject(mediaItem) {
    // Convert folder structure to JSON for AIs
    // Generate visual tree view for humans
    // Index files for search
    return mediaItem;
  }

  async processImage(mediaItem) {
    // Generate thumbnails
    // Run AI vision analysis
    // Extract text via OCR
    return mediaItem;
  }

  async processLink(mediaItem) {
    // Fetch metadata
    // Generate preview
    // AI analysis of content
    return mediaItem;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Multi-AI Chat Server running on port ${this.port}`);
      console.log(`WebSocket endpoint: ws://localhost:${this.port}/ws`);
      console.log(`HTTP API: http://localhost:${this.port}/api`);
    });
  }
}

// Data Models
class ChatSession {
  constructor(id, facilitatorId, name, aiPlatforms = []) {
    this.id = id;
    this.facilitatorId = facilitatorId;
    this.name = name;
    this.aiPlatforms = aiPlatforms;
    this.participants = new Map();
    this.messages = [];
    this.mediaItems = [];
    this.createdAt = new Date();
    this.status = 'active';
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId) {
    this.participants.delete(participantId);
  }

  addMessage(message) {
    this.messages.push(message);
  }

  addMediaItem(mediaItem) {
    this.mediaItems.push(mediaItem);
  }

  toJSON() {
    return {
      id: this.id,
      facilitatorId: this.facilitatorId,
      name: this.name,
      aiPlatforms: this.aiPlatforms,
      participants: Array.from(this.participants.values()).map(p => p.toJSON()),
      messageCount: this.messages.length,
      mediaCount: this.mediaItems.length,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}

class Participant {
  constructor(id, name, role, ws) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.ws = ws;
    this.joinedAt = new Date();
    this.status = 'active';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      joinedAt: this.joinedAt,
      status: this.status
    };
  }
}

class ChatMessage {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

class MediaItem {
  constructor(data) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new MultiAIChatServer(8080);
  server.start();
}

module.exports = MultiAIChatServer;
/**
 * Mock Go WebSocket Server
 * 
 * This module provides a mock implementation of the Go WebSocket server
 * for testing the messaging interface. It simulates the behavior of the
 * actual Go server by handling WebSocket connections, routing messages,
 * and sending appropriate responses.
 */

import { WebSocketMessage } from '@/types/websocket';

// Store for active connections by user ID
const activeConnections: Record<string, MockWebSocketConnection> = {};

// Store for messages by conversation ID
const messages: Record<string, WebSocketMessage[]> = {};

// Interface for the mock connection
export interface MockWebSocketConnection {
  userId: string;
  send: (message: WebSocketMessage) => void;
}

/**
 * Register a new WebSocket connection
 */
export function registerConnection(userId: string, sendCallback: (message: WebSocketMessage) => void): void {
  activeConnections[userId] = {
    userId,
    send: sendCallback
  };
  
  // Send connection confirmation
  sendCallback({
    type: 'connection',
    status: 'connected',
    receiverId: userId,
    content: '',
  });
}

/**
 * Unregister a WebSocket connection
 */
export function unregisterConnection(userId: string): void {
  delete activeConnections[userId];
}

/**
 * Process an incoming message
 */
export function processMessage(message: WebSocketMessage): void {
  // Handle message based on type
  switch (message.type) {
    case 'ping':
      handlePingMessage(message);
      break;
    case 'typing':
      handleTypingMessage(message);
      break;
    case 'read_receipt':
      handleReadReceiptMessage(message);
      break;
    default:
      handleChatMessage(message);
      break;
  }
}

/**
 * Handle ping messages
 */
function handlePingMessage(message: WebSocketMessage): void {
  if (message.senderId && activeConnections[message.senderId]) {
    activeConnections[message.senderId].send({
      type: 'ping',
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString(),
      receiverId: message.senderId!,
      content: ''
    });
  }
}

/**
 * Handle typing indicator messages
 */
function handleTypingMessage(message: WebSocketMessage): void {
  if (message.receiverId && activeConnections[message.receiverId]) {
    // Forward typing status to recipient
    activeConnections[message.receiverId].send({
      ...message,
      type: 'typing',
      content: '',
      receiverId: message.receiverId
    });
  }
}

/**
 * Handle read receipt messages
 */
function handleReadReceiptMessage(message: WebSocketMessage): void {
  if (message.receiverId && activeConnections[message.receiverId]) {
    // Forward read receipt to recipient
    activeConnections[message.receiverId].send({
      ...message,
      type: 'read_receipt',
      content: '',
      receiverId: message.receiverId
    });
  }
  
  // Also persist the read status (in a real server this would update the database)
  if (message.conversationId && message.timestamp) {
    const conversationMessages = messages[message.conversationId] || [];
    for (const msg of conversationMessages) {
      if (msg.senderId !== message.senderId && new Date(msg.createdAt!) <= new Date(message.timestamp)) {
        msg.isRead = true;
      }
    }
  }
}

/**
 * Handle regular chat messages
 */
function handleChatMessage(message: WebSocketMessage): void {
  // Generate an ID for the message if not provided
  const messageId = message.id || `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date();
  
  // Create a server-processed message
  const processedMessage: WebSocketMessage = {
    ...message,
    id: messageId,
    type: 'message',
    createdAt: timestamp,
    updatedAt: timestamp,
    content: message.content || '',
    receiverId: message.receiverId
  };
  
  // Store the message
  if (message.conversationId) {
    if (!messages[message.conversationId]) {
      messages[message.conversationId] = [];
    }
    messages[message.conversationId].push(processedMessage);
  }
  
  // Send delivery confirmation to sender
  if (message.senderId && activeConnections[message.senderId]) {
    activeConnections[message.senderId].send({
      type: 'delivery_status',
      status: 'delivered',
      clientId: message.clientId,
      timestamp: new Date().toISOString(),
      receiverId: message.senderId,
      content: ''
    });
    
    // After a short delay, send persistence confirmation
    setTimeout(() => {
      if (message.senderId && activeConnections[message.senderId]) {
        activeConnections[message.senderId].send({
          type: 'persistence_status',
          status: 'saved',
          clientId: message.clientId,
          timestamp: new Date().toISOString(),
          receiverId: message.senderId,
          content: ''
        });
      }
    }, 100);
  }
  
  // Forward message to recipient
  if (message.receiverId && activeConnections[message.receiverId]) {
    activeConnections[message.receiverId].send(processedMessage);
  }
}

/**
 * Get all messages for a conversation
 */
export function getConversationMessages(conversationId: string): WebSocketMessage[] {
  return messages[conversationId] || [];
}

/**
 * Clear all stored data (for test reset)
 */
export function resetMockServer(): void {
  Object.keys(activeConnections).forEach(key => {
    delete activeConnections[key];
  });
  
  Object.keys(messages).forEach(key => {
    delete messages[key];
  });
}

/**
 * Simulate sending a message from a specific user
 * (Useful for testing incoming messages)
 */
export function simulateIncomingMessage(message: WebSocketMessage): void {
  processMessage(message);
}

/**
 * Check if a user is connected
 */
export function isUserConnected(userId: string): boolean {
  return !!activeConnections[userId];
}

/**
 * Get the number of active connections
 */
export function getConnectionCount(): number {
  return Object.keys(activeConnections).length;
}

/**
 * Simulate a server shutdown
 */
export function simulateServerShutdown(): void {
  Object.values(activeConnections).forEach(connection => {
    connection.send({
      type: 'connection',
      status: 'server_shutdown',
      receiverId: connection.userId,
      content: ''
    });
  });
  resetMockServer();
}
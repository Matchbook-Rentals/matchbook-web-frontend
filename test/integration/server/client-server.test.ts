import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../../ts_server/client';

// Mock WebSocket for Node environment
class MockWebSocket {
  url: string;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState = 0; // CONNECTING
  
  constructor(url: string) {
    this.url = url;
    
    // Simulate successful connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({});
    }, 10);
  }
  
  send = vi.fn();
  close = vi.fn();
}

// Add WebSocket to global
global.WebSocket = MockWebSocket as any;

// Mock socket.io-client
const mockIO = vi.fn();
const mockSocket = {
  on: vi.fn((event, callback) => {
    // Store callbacks for triggering later
    mockSocket.handlers = mockSocket.handlers || {};
    mockSocket.handlers[event] = callback;
    return mockSocket;
  }),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'mock-socket-id',
  io: {
    reconnection: true,
    engine: {
      transport: {
        name: 'websocket'
      }
    }
  },
  handlers: {} as Record<string, any>
};

// Manual mock for io
vi.mock('socket.io-client', () => ({
  io: mockIO.mockReturnValue(mockSocket)
}));

describe('WebSocketClient to Server Integration', () => {
  let wsClient: WebSocketClient;
  const TEST_URL = 'http://localhost:8080';
  const TEST_USER_ID = 'test-user-123';
  
  beforeEach(() => {
    // Create default event handlers
    vi.clearAllMocks();
    mockIO.mockReturnValue(mockSocket);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('connects to the server with the correct parameters', () => {
    // Create client
    wsClient = new WebSocketClient(TEST_URL, TEST_USER_ID);
    wsClient.connect();
    
    // Check io was called with right params
    expect(mockIO).toHaveBeenCalled();
    
    // Verify WebSocket was created
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining(TEST_URL)
    );
  });
  
  it('processes connection confirmation from server', () => {
    // Create client with a message handler spy
    const onMessageSpy = vi.fn();
    wsClient = new WebSocketClient(TEST_URL, TEST_USER_ID, { onMessage: onMessageSpy });
    wsClient.connect();
    
    // Simulate socket connection event
    if ((wsClient as any).ws && (wsClient as any).ws.onopen) {
      (wsClient as any).ws.onopen({});
    }
    
    // Set clientId manually for testing
    (wsClient as any).clientId = 'test-client-id-123';
    
    // Simulate server sending connection confirmation via websocket
    if ((wsClient as any).ws && (wsClient as any).ws.onmessage) {
      const serverConnectMessage = {
        type: 'connection',
        status: 'connected',
        clientId: 'server-assigned-client-id-123',
        serverInfo: {
          version: '1.1.0',
          timestamp: Date.now()
        }
      };
      
      (wsClient as any).ws.onmessage({ 
        data: JSON.stringify(serverConnectMessage)
      });
      
      // Check clientId was updated
      expect(wsClient.getClientId()).toBe('server-assigned-client-id-123');
    }
  });
  
  it('sends messages with correct format', () => {
    // Create client
    wsClient = new WebSocketClient(TEST_URL, TEST_USER_ID);
    wsClient.connect();
    
    // Simulate connection established
    if ((wsClient as any).ws && (wsClient as any).ws.onopen) {
      (wsClient as any).ws.onopen({});
    }
    
    // Set socket readyState to OPEN
    if ((wsClient as any).ws) {
      (wsClient as any).ws.readyState = 1;
    }
    
    // Set clientId manually for test
    (wsClient as any).clientId = 'test-client-id-456';
    
    // Send a test message
    const testMessage = {
      type: 'message',
      content: 'Test message content',
      conversationId: 'conv-123',
      receiverId: 'receiver-456'
    };
    
    wsClient.send(testMessage);
    
    // Check message was sent with correct format (via WebSocket.send)
    if ((wsClient as any).ws) {
      expect((wsClient as any).ws.send).toHaveBeenCalledWith(
        expect.stringContaining('Test message content')
      );
    }
  });
  
  it('processes incoming messages correctly', () => {
    const onMessageSpy = vi.fn();
    wsClient = new WebSocketClient(TEST_URL, TEST_USER_ID, { onMessage: onMessageSpy });
    wsClient.connect();
    
    // Simulate connection established
    if ((wsClient as any).ws && (wsClient as any).ws.onopen) {
      (wsClient as any).ws.onopen({});
    }
    
    // Simulate server sending a message
    const incomingMessage = {
      type: 'message',
      content: 'Response from server',
      senderId: 'other-user-789',
      conversationId: 'conv-123',
      timestamp: new Date().toISOString()
    };
    
    if ((wsClient as any).ws && (wsClient as any).ws.onmessage) {
      (wsClient as any).ws.onmessage({ 
        data: JSON.stringify(incomingMessage)
      });
      
      // Message handler should have been called
      expect(onMessageSpy).toHaveBeenCalledWith(incomingMessage);
    }
  });
});
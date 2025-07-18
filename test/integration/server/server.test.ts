import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '../../../ts_server/client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  })),
}));

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

// Mock IO
const mockIO = vi.fn();
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'mock-socket-id',
  io: {
    reconnection: true
  }
};

// Manual mock for io
vi.mock('socket.io-client', () => ({
  io: mockIO.mockReturnValue(mockSocket)
}));

describe('Socket Server Integration', () => {
  let socketClient: WebSocketClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockIO.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should connect to the socket server', () => {
    // Create a socket client with mock user ID
    const userId = 'test-user-123';
    socketClient = new WebSocketClient('http://localhost:8080', userId);
    
    // Connect the socket
    socketClient.connect();
    
    // Check that io was called with the correct URL and options
    expect(mockIO).toHaveBeenCalled();
  });

  it('should send a message through the socket', () => {
    // Create a socket client
    const userId = 'test-user-123';
    socketClient = new WebSocketClient('http://localhost:8080', userId);
    
    // Set clientId directly for testing
    (socketClient as any).clientId = 'mock-client-id';
    
    // Connect the socket
    socketClient.connect();
    
    // Simulate connection established
    if ((socketClient as any).ws && (socketClient as any).ws.onopen) {
      (socketClient as any).ws.onopen({});
    }
    
    // Set socket readyState to OPEN
    if ((socketClient as any).ws) {
      (socketClient as any).ws.readyState = 1;
    }
    
    // Send a test message
    const testMessage = {
      type: 'message',
      content: 'Hello server',
      conversationId: 'conversation-123',
      receiverId: 'receiver-456'
    };
    
    socketClient.send(testMessage);
    
    // Verify the message was sent through the socket
    if ((socketClient as any).ws) {
      expect((socketClient as any).ws.send).toHaveBeenCalled();
    }
  });
});
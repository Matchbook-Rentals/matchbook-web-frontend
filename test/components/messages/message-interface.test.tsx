import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MessageInterface from '@/app/app/rent/messages/message-interface';
import { io } from 'socket.io-client';
import { WebSocketClient } from '../../../ts_server/client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  })),
}));

// Mock conversation components
vi.mock('@/app/app/messages/components/ConversationList', () => ({
  default: vi.fn(({ onSelectConversation }) => (
    <div data-testid="conversation-list">
      <button data-testid="select-conv" onClick={() => onSelectConversation('mock-conv-1')}>
        Select Conversation
      </button>
    </div>
  )),
}));

vi.mock('@/app/app/messages/components/MessageArea', () => ({
  default: vi.fn(({ onSendMessage }) => (
    <div data-testid="message-area">
      <button data-testid="send-message" onClick={() => onSendMessage('Hello test')}>
        Send Message
      </button>
    </div>
  )),
}));

describe('MessageInterface Component', () => {
  const mockUser = { id: 'user-123' };
  const mockConversations = [
    {
      id: 'mock-conv-1',
      messages: [],
      participants: [
        {
          userId: 'user-123',
          role: 'Host',
          User: { id: 'user-123', firstName: 'Test User', email: 'test@example.com' }
        },
        {
          userId: 'other-user-456',
          role: 'Tenant',
          User: { id: 'other-user-456', firstName: 'Other User', email: 'other@example.com' }
        }
      ],
    },
  ];
  
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock socket
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-socket-id',
    };
    
    // Have io return our mock socket
    (io as unknown as any).mockReturnValue(mockSocket);
    
    // Set Jest timing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders the conversation list and message area', () => {
    render(<MessageInterface conversations={mockConversations} user={mockUser} />);
    
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    
    // Initially, message area should not be visible until a conversation is selected
    expect(screen.queryByTestId('message-area')).not.toBeInTheDocument();
    
    // Select a conversation
    fireEvent.click(screen.getByTestId('select-conv'));
    
    // After selection, message area should be visible
    expect(screen.getByTestId('message-area')).toBeInTheDocument();
  });

  it('connects to the socket server when component is mounted', () => {
    render(<MessageInterface conversations={mockConversations} user={mockUser} />);
    
    // Check that io was called to establish connection
    expect(io).toHaveBeenCalled();
    
    // Verify socket event listeners were registered
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('typing', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('read_receipt', expect.any(Function));
  });

  it('sends a message when the send button is clicked', () => {
    render(<MessageInterface conversations={mockConversations} user={mockUser} />);
    
    // Select a conversation first
    fireEvent.click(screen.getByTestId('select-conv'));
    
    // Create and trigger our mockSocket's 'connect' handler to simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    act(() => {
      connectHandler();
    });
    
    // Now send a message
    fireEvent.click(screen.getByTestId('send-message'));
    
    // Check that socket.emit was called with a message
    expect(mockSocket.emit).toHaveBeenCalledWith('message', expect.objectContaining({
      content: 'Hello test',
      conversationId: 'mock-conv-1',
      senderId: 'user-123',
    }), expect.any(Function));
  });
});
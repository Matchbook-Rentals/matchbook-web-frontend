import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageInterface from '../message-interface';
import { useUser } from '@clerk/nextjs';
import * as conversationActions from '@/app/actions/conversations';
import * as messageActions from '@/app/actions/messages';

// Mock useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock server actions
jest.mock('@/app/actions/conversations', () => ({
  getAllConversations: jest.fn(),
  createConversation: jest.fn(),
  deleteConversation: jest.fn(),
  createMessage: jest.fn(),
}));

jest.mock('@/app/actions/messages', () => ({
  markMessagesAsReadByTimestamp: jest.fn(),
}));

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState = WebSocket.CONNECTING;
  url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after 50ms
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen({});
    }, 50);
  }

  send(data: string) {
    // Process the message and simulate a response
    try {
      const message = JSON.parse(data);
      
      // Echo message back as if it was delivered
      if (message.type !== 'ping' && this.onmessage) {
        // For normal messages, simulate delivery and persistence statuses
        if (!message.type || message.type === 'message') {
          // Simulate message delivery
          setTimeout(() => {
            this.onmessage?.({
              data: JSON.stringify({
                type: 'delivery_status',
                status: 'delivered',
                clientId: message.clientId,
                timestamp: new Date().toISOString()
              })
            });
            
            // Simulate message persistence
            setTimeout(() => {
              this.onmessage?.({
                data: JSON.stringify({
                  type: 'persistence_status',
                  status: 'saved',
                  clientId: message.clientId,
                  timestamp: new Date().toISOString()
                })
              });
            }, 50);
          }, 50);

          // Echo back the message as if it was sent
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  ...message,
                  id: `server-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  type: 'message'
                })
              });
            }
          }, 100);
        }
        
        // For typing indicators
        if (message.type === 'typing' && this.onmessage) {
          this.onmessage({
            data: JSON.stringify(message)
          });
        }

        // For read receipts
        if (message.type === 'read_receipt' && this.onmessage) {
          this.onmessage({
            data: JSON.stringify(message)
          });
        }
      }

      // Handle ping messages
      if (message.type === 'ping' && this.onmessage) {
        this.onmessage({
          data: JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
            serverTime: new Date().toISOString()
          })
        });
      }
    } catch (e) {
      console.error('Error processing mock message:', e);
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose({ wasClean: true, code: 1000 });
  }
}

// Replace the WebSocket constructor with our mock
global.WebSocket = MockWebSocket as any;

// Sample conversation data
const mockConversations = [
  {
    id: 'conv1',
    messages: [
      {
        id: 'msg1',
        content: 'Hello there',
        senderId: 'user2',
        conversationId: 'conv1',
        createdAt: new Date(Date.now() - 30000),
        updatedAt: new Date(Date.now() - 30000),
        isRead: true
      }
    ],
    participants: [
      {
        userId: 'user1',
        role: 'Host',
        User: { id: 'user1', firstName: 'Current', lastName: 'User', email: 'user@example.com', imageUrl: null }
      },
      {
        userId: 'user2',
        role: 'Tenant',
        User: { id: 'user2', firstName: 'Other', lastName: 'Person', email: 'other@example.com', imageUrl: null }
      }
    ],
    createdAt: new Date()
  }
];

// Mock user data
const mockUser = {
  id: 'user1',
  fullName: 'Current User',
  firstName: 'Current',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  publicMetadata: {}
};

describe('MessageInterface Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup useUser mock
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Setup createMessage mock
    (conversationActions.createMessage as jest.Mock).mockResolvedValue({
      id: 'new-msg',
      content: 'Test message',
      senderId: 'user1',
      conversationId: 'conv1',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Setup markMessagesAsReadByTimestamp mock
    (messageActions.markMessagesAsReadByTimestamp as jest.Mock).mockResolvedValue(true);
  });

  it('renders conversation list and message area', () => {
    render(<MessageInterface conversations={mockConversations} />);
    
    // Check if conversation list is rendered
    expect(screen.getByText('Other Person')).toBeInTheDocument();
    
    // Check if the initial message is shown in the list
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    
    // Check if the empty message area is rendered
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('selects a conversation and displays messages', async () => {
    render(<MessageInterface conversations={mockConversations} />);
    
    // Click on the conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Wait for messages to load
    await waitFor(() => {
      // Check if the message area shows the message content
      expect(screen.getByText('Hello there')).toBeInTheDocument();
      
      // Check if the textarea is enabled
      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).not.toBeDisabled();
    });
  });

  it('sends a message and receives a response', async () => {
    render(<MessageInterface conversations={mockConversations} />);
    
    // Select the conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Enter a message
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: '' }); // Send button typically has no accessible name
    fireEvent.click(sendButton);
    
    // Wait for the message to appear in the interface
    await waitFor(() => {
      expect(screen.getAllByText('Test message')).toHaveLength(1);
    });
    
    // Wait for the "Delivered" message to appear
    await waitFor(() => {
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows typing indicator when other user is typing', async () => {
    render(<MessageInterface conversations={mockConversations} />);
    
    // Select the conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Simulate receiving a typing indicator message
    act(() => {
      const mockWebSocket = (global.WebSocket as any).mock.instances[0];
      mockWebSocket.onmessage({
        data: JSON.stringify({
          type: 'typing',
          senderId: 'user2',
          receiverId: 'user1',
          conversationId: 'conv1',
          isTyping: true,
          timestamp: Date.now()
        })
      });
    });
    
    // Check if typing indicator is shown
    await waitFor(() => {
      // The typing indicator is typically represented by 3 animated dots
      const typingElements = screen.getAllByRole('presentation', { hidden: true });
      expect(typingElements.length).toBeGreaterThan(0);
    });
  });

  it('handles WebSocket reconnection when connection is lost', async () => {
    render(<MessageInterface conversations={mockConversations} />);
    
    // Select the conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Trigger a WebSocket close
    act(() => {
      const mockWebSocket = (global.WebSocket as any).mock.instances[0];
      mockWebSocket.onclose({ wasClean: false, code: 1006 });
    });
    
    // Check if disconnected status is shown
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
    
    // Simulate a reconnection - a new WebSocket should be created
    await waitFor(() => {
      const mockWebSocket = (global.WebSocket as any).mock.instances[1];
      if (mockWebSocket && mockWebSocket.onopen) {
        act(() => {
          mockWebSocket.onopen({});
        });
      }
    }, { timeout: 3000 });
    
    // Check if connected status is shown
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('sends messages via REST API when WebSocket is not available', async () => {
    // Mock the WebSocket to be in a disconnected state
    (global.WebSocket as any).mockImplementation(() => {
      const ws = new MockWebSocket('ws://example.com');
      ws.readyState = WebSocket.CLOSED;
      setTimeout(() => {
        if (ws.onclose) ws.onclose({ wasClean: false, code: 1006 });
      }, 50);
      return ws;
    });
    
    render(<MessageInterface conversations={mockConversations} />);
    
    // Select the conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Enter a message
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Test REST message' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);
    
    // Verify that createMessage was called (REST API fallback)
    await waitFor(() => {
      expect(conversationActions.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test REST message',
          conversationId: 'conv1'
        })
      );
    });
    
    // Verify the message appears in the UI
    expect(screen.getByText('Test REST message')).toBeInTheDocument();
  });
});
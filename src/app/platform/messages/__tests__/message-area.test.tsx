import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageArea from '../components/MessageArea';

// Mock UploadButton component
jest.mock('@/app/utils/uploadthing', () => ({
  UploadButton: ({ onClientUploadComplete, content, appearance }) => (
    <button 
      data-testid="mock-upload-button"
      onClick={() => onClientUploadComplete?.([{
        name: 'test-image.jpg',
        size: 12345,
        key: 'test-key',
        url: 'https://example.com/test-image.jpg',
        customId: null,
        type: 'image/jpeg',
        serverData: {
          uploadedBy: 'user1',
          fileUrl: 'https://example.com/test-image.jpg'
        }
      }])}
    >
      {content.button({ ready: true, isUploading: false })}
    </button>
  )
}));

// Mock Dialog from Radix UI
jest.mock('@radix-ui/react-dialog', () => ({
  DialogTrigger: ({ children }) => <div data-testid="mock-dialog-trigger">{children}</div>,
}));

// Sample data for tests
const mockConversation = {
  id: 'conv1',
  participants: [
    {
      userId: 'user1',
      role: 'Host',
      User: { id: 'user1', firstName: 'Current', email: 'user@example.com', imageUrl: 'https://example.com/avatar1.jpg' }
    },
    {
      userId: 'user2',
      role: 'Tenant',
      User: { id: 'user2', firstName: 'Other', email: 'other@example.com', imageUrl: 'https://example.com/avatar2.jpg' }
    }
  ]
};

const mockMessages = [
  {
    id: 'msg1',
    content: 'Hello there',
    senderId: 'user2',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
    isRead: true
  },
  {
    id: 'msg2',
    content: 'How are you?',
    senderId: 'user1',
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000),
    isRead: true
  }
];

describe('MessageArea Component', () => {
  const onSendMessageMock = jest.fn();
  const onBackMock = jest.fn();
  const onTypingMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders message area with messages', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Check if messages are displayed
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    
    // Check if input area is displayed
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    
    // Check if participant info is displayed
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('sends a text message when enter is pressed', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Press Enter
    fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Check if onSendMessage was called with the correct message
    expect(onSendMessageMock).toHaveBeenCalledWith('Test message');
    
    // Check if textarea is cleared
    expect(textarea).toHaveValue('');
  });

  it('sends a message when send button is clicked', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Find and click the send button (it has no text, just an icon)
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);
    
    // Check if onSendMessage was called with the correct message
    expect(onSendMessageMock).toHaveBeenCalledWith('Test message');
  });

  it('calls onTyping when user types', async () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Type a message
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'T' } });
    
    // Check if onTyping was called with true
    expect(onTypingMock).toHaveBeenCalledWith(true);
    
    // Wait for typing timeout (3 seconds in the component)
    await waitFor(() => {
      expect(onTypingMock).toHaveBeenCalledWith(false);
    }, { timeout: 4000 });
  });

  it('shows typing indicator when other user is typing', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
        isOtherUserTyping={true}
      />
    );

    // Look for the typing animation dots (there should be 3)
    const typingDots = screen.getAllByRole('presentation', { hidden: true });
    expect(typingDots.length).toBeGreaterThan(0);
  });

  it('handles file uploads', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Click the upload button
    const uploadButton = screen.getByTestId('mock-upload-button');
    fireEvent.click(uploadButton);
    
    // Click the send button
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);
    
    // Check if onSendMessage was called with the file data
    expect(onSendMessageMock).toHaveBeenCalledWith(
      '',
      'https://example.com/test-image.jpg',
      'test-image.jpg',
      'test-key',
      'image/jpeg'
    );
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={mockMessages}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Find and click the back button
    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);
    
    // Check if onBack was called
    expect(onBackMock).toHaveBeenCalled();
  });

  it('shows empty state when no conversation is selected', () => {
    render(
      <MessageArea
        selectedConversation={null}
        messages={[]}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Check for the empty state message
    expect(screen.getByText('Select a conversation from the list to get started')).toBeInTheDocument();
  });

  it('shows empty conversation message when conversation has no messages', () => {
    render(
      <MessageArea
        selectedConversation={mockConversation}
        messages={[]}
        onSendMessage={onSendMessageMock}
        currentUserId="user1"
        currentUserImage="https://example.com/avatar1.jpg"
        onBack={onBackMock}
        onTyping={onTypingMock}
      />
    );

    // Check for the empty conversation message
    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    expect(screen.getByText('Send a message to start the conversation!')).toBeInTheDocument();
  });
});
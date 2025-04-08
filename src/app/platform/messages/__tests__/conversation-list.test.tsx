import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationList from '../components/ConversationList';

// Sample data for tests
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
  },
  {
    id: 'conv2',
    messages: [
      {
        id: 'msg2',
        content: 'New message',
        senderId: 'user3',
        conversationId: 'conv2',
        createdAt: new Date(Date.now() - 10000),
        updatedAt: new Date(Date.now() - 10000),
        isRead: false
      }
    ],
    participants: [
      {
        userId: 'user1',
        role: 'Tenant',
        User: { id: 'user1', firstName: 'Current', lastName: 'User', email: 'user@example.com', imageUrl: null }
      },
      {
        userId: 'user3',
        role: 'Host',
        User: { id: 'user3', firstName: 'Third', lastName: 'Person', email: 'third@example.com', imageUrl: null }
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
  imageUrl: 'https://example.com/avatar.jpg'
};

describe('ConversationList Component', () => {
  const onSelectConversationMock = jest.fn();
  const onCreateConversationMock = jest.fn();
  const onTabChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversation list with conversations', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Check if conversations are listed
    expect(screen.getByText('Other Person')).toBeInTheDocument();
    expect(screen.getByText('Third Person')).toBeInTheDocument();
    
    // Check if messages are displayed
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('New message')).toBeInTheDocument();
  });

  it('selects a conversation when clicked', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Click on a conversation
    fireEvent.click(screen.getByText('Other Person'));
    
    // Check if the onSelectConversation was called with the correct ID
    expect(onSelectConversationMock).toHaveBeenCalledWith('conv1');
  });

  it('filters conversations by search term', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Messages');
    fireEvent.change(searchInput, { target: { value: 'Third' } });
    
    // Check if only matching conversations are displayed
    expect(screen.queryByText('Other Person')).not.toBeInTheDocument();
    expect(screen.getByText('Third Person')).toBeInTheDocument();
  });

  it('filters conversations by unread status', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Check the unread only checkbox
    const unreadCheckbox = screen.getByLabelText('Unread Only');
    fireEvent.click(unreadCheckbox);
    
    // Only conv2 has unread messages
    expect(screen.queryByText('Other Person')).not.toBeInTheDocument();
    expect(screen.getByText('Third Person')).toBeInTheDocument();
  });

  it('changes tab when tab button is clicked', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Click on the All button to open the dropdown
    fireEvent.click(screen.getByText('All'));
    
    // Click on the Host option
    fireEvent.click(screen.getByText('Hosting'));
    
    // Check if onTabChange was called with 'Hosting'
    expect(onTabChangeMock).toHaveBeenCalledWith('Hosting');
  });

  it('filters conversations by role when tab is changed', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="Host"
      />
    );

    // Only the conversation where the user is a Host should be visible
    expect(screen.getByText('Other Person')).toBeInTheDocument();
    expect(screen.queryByText('Third Person')).not.toBeInTheDocument();
  });

  it('shows empty state when no conversations match filters', () => {
    render(
      <ConversationList
        conversations={[]}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
      />
    );

    // Check for the empty state message
    expect(screen.getByText('No conversations found')).toBeInTheDocument();
  });

  it('highlights the selected conversation', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelectConversationMock}
        onCreateConversation={onCreateConversationMock}
        user={mockUser}
        onTabChange={onTabChangeMock}
        activeTab="all"
        selectedConversationId="conv1"
      />
    );

    // Check if the first conversation has a selected class (contains bg-gray-100)
    const conversationElements = screen.getAllByRole('generic');
    const selectedConversation = conversationElements.find(
      element => element.textContent?.includes('Other Person') && element.className.includes('bg-gray-100')
    );
    
    expect(selectedConversation).toBeTruthy();
  });
});
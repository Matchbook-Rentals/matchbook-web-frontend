import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { useWebSocketManager, UseWebSocketManagerProps, MessageData as WebSocketMessageData } from '../../src/hooks/useWebSocketManager';
import { useConversationManager, UseConversationManagerProps, ManagedConversation, User, MessageData as ConversationMessageData } from '../../src/hooks/useConversationManager';

// --- Mock socket.io-client (similar to useWebSocketManager.test.ts) ---
var mockSocketInstance: any | null = null;

const createMockSocketInternal = (url?: string, opts?: any): any => {
  const newSocket: any = {
    _listeners: {},
    on: vi.fn((event, listener) => {
      console.log(`[MOCK_SOCKET] Registering listener for event: ${event}`);
      newSocket._listeners[event] = listener;
      return newSocket;
    }),
    emit: vi.fn((event, ...args) => {
      console.log(`[MOCK_SOCKET] Test emitting event: ${event} with data:`, args);
      if (newSocket._listeners[event]) {
        act(() => newSocket._listeners[event](...args));
      }
    }),
    disconnect: vi.fn(() => {
      newSocket.connected = false;
      console.log('[MOCK_SOCKET] Disconnecting (test call or simulated server disconnect)');
      if (newSocket._listeners['disconnect']) {
        act(() => newSocket._listeners['disconnect']('io client disconnect'));
      }
      return newSocket;
    }),
    connect: vi.fn(() => {
      newSocket.connected = true;
      newSocket.id = `socket_${Math.random()}`;
      console.log('[MOCK_SOCKET] Connecting (simulated)');
      if (newSocket._listeners['connect']) {
        act(() => newSocket._listeners['connect']());
      }
      return newSocket;
    }),
    connected: false,
    id: undefined,
    io: { 
      opts: opts || { query: {} }, 
      engine: { transport: { name: 'mocked-websocket' } as any },
    },
  };
  return newSocket;
};

vi.mock('socket.io-client', async () => {
  const actual = await vi.importActual<typeof import('socket.io-client')>('socket.io-client');
  return {
    ...actual,
    io: vi.fn((url, opts) => {
      mockSocketInstance = createMockSocketInternal(url, opts);
      return mockSocketInstance;
    }),
  };
});

const simulateSocketEvent = (event: string, ...data: any[]) => {
  if (mockSocketInstance?._listeners[event]) {
    act(() => {
      mockSocketInstance._listeners[event](...data);
    });
  }
};
// --- End Mock socket.io-client ---

describe('useConversationManager and useWebSocketManager Integration', () => {
  const socketUrl = 'http://integration-test.com';
  const currentUserId = 'current-user-id';
  const otherUserId = 'other-user-id';

  const mockCurrentUser: User = {
    id: currentUserId,
  };

  let initialConversations: ManagedConversation[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketInstance = null; // Reset before each test
    vi.useFakeTimers();
    // Setup initial conversations with some messages for read receipt testing
    const messageId1 = 'msg-to-be-read-1';
    const messageId2 = 'msg-to-be-read-2';
    initialConversations = [
      {
        id: 'conv1',
        participants: [
          { userId: currentUserId, role: 'Tenant', User: { id: currentUserId, firstName: 'Current' } },
          { userId: otherUserId, role: 'Host', User: { id: otherUserId, firstName: 'Other' } },
        ],
        messages: [
          {
            id: messageId1, content: 'Message 1 from current user',
            senderId: currentUserId, receiverId: otherUserId, senderRole: 'Tenant',
            conversationId: 'conv1', createdAt: new Date().toISOString(), isRead: false, deliveryStatus: 'delivered'
          },
          {
            id: messageId2, content: 'Message 2 from current user',
            senderId: currentUserId, receiverId: otherUserId, senderRole: 'Tenant',
            conversationId: 'conv1', createdAt: new Date().toISOString(), isRead: false, deliveryStatus: 'delivered'
          },
          {
            id: 'msg-from-other', content: 'Message from other user',
            senderId: otherUserId, receiverId: currentUserId, senderRole: 'Host',
            conversationId: 'conv1', createdAt: new Date().toISOString(), isRead: false, deliveryStatus: 'delivered'
          }
        ],
      },
    ];
  });

  afterEach(() => {
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
  });

  test('should process an incoming message through WebSocketManager and update ConversationManager state', async () => {
    // 1. Setup and render useConversationManager
    const mockWebSocketSendMessage = vi.fn();
    const mockRestCreateMessageAction = vi.fn();
    const mockWebSocketSendTyping = vi.fn();
    const mockSendReadReceiptAction = vi.fn();
    const mockPersistMessagesAsReadAction = vi.fn();
    const mockServerCreateConversationAction = vi.fn();
    const mockDeleteConversationAction = vi.fn();

    const convManagerProps: UseConversationManagerProps = {
      initialConversations,
      currentUser: mockCurrentUser,
      webSocketSendMessage: mockWebSocketSendMessage,
      restCreateMessageAction: mockRestCreateMessageAction, 
      webSocketSendTyping: mockWebSocketSendTyping,
      sendReadReceiptAction: mockSendReadReceiptAction,
      persistMessagesAsReadAction: mockPersistMessagesAsReadAction,
      serverCreateConversationAction: mockServerCreateConversationAction,
      deleteConversationAction: mockDeleteConversationAction,
    };

    const { result: convManagerResult } = renderHook(() => useConversationManager(convManagerProps));

    // 2. Setup and render useWebSocketManager with handlers from useConversationManager
    const wsManagerProps: UseWebSocketManagerProps = {
      socketUrl,
      userId: currentUserId,
      onMessageReceived: convManagerResult.current.onMessageReceived,
      onTypingReceived: convManagerResult.current.onTypingReceived,
      onReadReceiptReceived: convManagerResult.current.onReadReceiptReceived,
      onConnectionStatusChange: vi.fn(), // Can be a simple mock for this test
    };

    renderHook(() => useWebSocketManager(wsManagerProps));
    
    // Wait for wsManager to attempt connection
    await act(async () => {});
    act(() => { vi.runOnlyPendingTimers(); });

    // Ensure socket is 'connected' for message processing to occur as expected
    if (mockSocketInstance && !mockSocketInstance.connected) {
      act(() => mockSocketInstance?.connect());
    }
    expect(mockSocketInstance?.connected).toBe(true);

    // 3. Simulate an incoming WebSocket message
    const incomingMessage: WebSocketMessageData = { // Use WebSocketMessageData type here
      id: 'new-msg-id',
      conversationId: 'conv1',
      senderId: otherUserId,
      receiverId: currentUserId,
      senderRole: 'Host',
      content: 'Hello from integration test!',
      createdAt: new Date().toISOString(),
      type: 'message',
    };

    simulateSocketEvent('message', incomingMessage);

    // 4. Assertions: Check if useConversationManager's state was updated
    const updatedConversation = convManagerResult.current.allConversations.find(c => c.id === 'conv1');
    expect(updatedConversation).toBeDefined();
    expect(updatedConversation?.messages).toHaveLength(4);
    const receivedMessage = updatedConversation?.messages.find(m => m.id === incomingMessage.id);
    expect(receivedMessage?.id).toBe(incomingMessage.id);
    expect(receivedMessage?.content).toBe(incomingMessage.content);
    expect(receivedMessage?.senderId).toBe(incomingMessage.senderId);
    // Ensure the type from useConversationManager (HookMessageData) is compatible
    // This implicitly tests that the onMessageReceived handler in useConversationManager
    // correctly processes the message and updates its internal state.
  });

  test('should process an incoming typing event through WebSocketManager and update ConversationManager state', async () => {
    // 1. Setup and render useConversationManager
    const mockWebSocketSendMessage = vi.fn();
    const mockRestCreateMessageAction = vi.fn();
    const mockWebSocketSendTyping = vi.fn();
    const mockSendReadReceiptAction = vi.fn();
    const mockPersistMessagesAsReadAction = vi.fn();
    const mockServerCreateConversationAction = vi.fn();
    const mockDeleteConversationAction = vi.fn();

    const convManagerProps: UseConversationManagerProps = {
      initialConversations,
      currentUser: mockCurrentUser,
      webSocketSendMessage: mockWebSocketSendMessage,
      restCreateMessageAction: mockRestCreateMessageAction, 
      webSocketSendTyping: mockWebSocketSendTyping,
      sendReadReceiptAction: mockSendReadReceiptAction,
      persistMessagesAsReadAction: mockPersistMessagesAsReadAction,
      serverCreateConversationAction: mockServerCreateConversationAction,
      deleteConversationAction: mockDeleteConversationAction,
    };

    const { result: convManagerResult } = renderHook(() => useConversationManager(convManagerProps));

    // 2. Setup and render useWebSocketManager with handlers from useConversationManager
    const wsManagerProps: UseWebSocketManagerProps = {
      socketUrl,
      userId: currentUserId,
      onMessageReceived: convManagerResult.current.onMessageReceived,
      onTypingReceived: convManagerResult.current.onTypingReceived,
      onReadReceiptReceived: convManagerResult.current.onReadReceiptReceived,
      onConnectionStatusChange: vi.fn(), // Can be a simple mock for this test
    };

    renderHook(() => useWebSocketManager(wsManagerProps));
    
    // Wait for wsManager to attempt connection
    await act(async () => {});
    act(() => { vi.runOnlyPendingTimers(); });

    // Ensure socket is 'connected' for message processing to occur as expected
    if (mockSocketInstance && !mockSocketInstance.connected) {
      act(() => mockSocketInstance?.connect());
    }
    expect(mockSocketInstance?.connected).toBe(true);

    // 3. Simulate an incoming WebSocket typing event
    // The payload should align with HookMessageData for onTypingReceived in useConversationManager
    const incomingTypingPayload: ConversationMessageData = { 
      conversationId: 'conv1',
      senderId: otherUserId,
      isTyping: true, 
      // Required fields from MessageData (base for HookMessageData)
      content: '', // Typically empty for typing signals
      senderRole: 'Host', 
      receiverId: currentUserId, 
      // Optional fields, can be omitted if not used by onTypingReceived logic for state update
      // id: 'typing-event-id', // Not usually relevant for ephemeral typing status
      // createdAt: new Date().toISOString(), // Timestamp is usually set by onTypingReceived itself
      // type: 'typing', // This is handled by socket event name, not typically in payload for this handler
    };

    // Simulate the 'typing' event. useWebSocketManager will pass this payload to useConversationManager's onTypingReceived
    simulateSocketEvent('typing', incomingTypingPayload);

    // 4. Assertions: Check if useConversationManager's typingUsers state was updated
    const typingUsersState = convManagerResult.current.typingUsers;
    const expectedTypingKey = `${incomingTypingPayload.conversationId}:${incomingTypingPayload.senderId}`;

    expect(typingUsersState[expectedTypingKey]).toBeDefined();
    expect(typingUsersState[expectedTypingKey]?.isTyping).toBe(true);
    expect(typingUsersState[expectedTypingKey]?.timestamp).toBeDefined(); // Check if timestamp was set
  });

  test('should process an incoming read receipt event through WebSocketManager and update ConversationManager state', async () => {
    // 1. Setup and render useConversationManager (initialConversations already has messages)
    const mockWebSocketSendMessage = vi.fn();
    const mockRestCreateMessageAction = vi.fn();
    const mockWebSocketSendTyping = vi.fn();
    const mockSendReadReceiptAction = vi.fn(); // This is for *sending* receipts, not handling incoming
    const mockPersistMessagesAsReadAction = vi.fn();
    const mockServerCreateConversationAction = vi.fn();
    const mockDeleteConversationAction = vi.fn();

    const convManagerProps: UseConversationManagerProps = {
      initialConversations,
      currentUser: mockCurrentUser,
      webSocketSendMessage: mockWebSocketSendMessage,
      restCreateMessageAction: mockRestCreateMessageAction, 
      webSocketSendTyping: mockWebSocketSendTyping,
      sendReadReceiptAction: mockSendReadReceiptAction,
      persistMessagesAsReadAction: mockPersistMessagesAsReadAction,
      serverCreateConversationAction: mockServerCreateConversationAction,
      deleteConversationAction: mockDeleteConversationAction,
    };

    const { result: convManagerResult } = renderHook(() => useConversationManager(convManagerProps));

    // 2. Setup and render useWebSocketManager with handlers from useConversationManager
    const wsManagerProps: UseWebSocketManagerProps = {
      socketUrl,
      userId: currentUserId,
      onMessageReceived: convManagerResult.current.onMessageReceived,
      onTypingReceived: convManagerResult.current.onTypingReceived,
      onReadReceiptReceived: convManagerResult.current.onReadReceiptReceived,
      onConnectionStatusChange: vi.fn(),
    };

    renderHook(() => useWebSocketManager(wsManagerProps));
    
    await act(async () => {});
    act(() => { vi.runOnlyPendingTimers(); });

    if (mockSocketInstance && !mockSocketInstance.connected) {
      act(() => mockSocketInstance?.connect());
    }
    expect(mockSocketInstance?.connected).toBe(true);

    // 3. Simulate an incoming WebSocket read receipt event
    const messagesToMarkReadIds = ['msg-to-be-read-1', 'msg-to-be-read-2'];
    const readReceiptTimestamp = new Date().toISOString();

    const incomingReadReceiptPayload: WebSocketMessageData = { // Use WebSocketMessageData as that's what useWebSocketManager expects
      conversationId: 'conv1',
      senderId: otherUserId, // otherUserId read messages sent by currentUserId
      messageIds: messagesToMarkReadIds,
      updatedAt: readReceiptTimestamp, // Timestamp for when messages were read
      // Other fields required by MessageData (base of WebSocketMessageData)
      content: '', // Not relevant for read receipt logic itself
      senderRole: 'Host', // Role of the user who read the message
      receiverId: currentUserId, // User whose messages were read
      type: 'read_receipt', // Corrected to snake_case based on lint error
    };

    // Simulate the 'read_receipt' event
    simulateSocketEvent('read_receipt', incomingReadReceiptPayload);

    // 4. Assertions: Check if messages in useConversationManager's state were updated
    const updatedConversation = convManagerResult.current.allConversations.find(c => c.id === 'conv1');
    expect(updatedConversation).toBeDefined();

    messagesToMarkReadIds.forEach(msgId => {
      const msg = updatedConversation?.messages.find(m => m.id === msgId);
      expect(msg).toBeDefined();
      expect(msg?.isRead).toBe(true);
      expect(msg?.deliveryStatus).toBe('read');
      expect(msg?.updatedAt).toBe(readReceiptTimestamp);
    });

    // Check that a message not in the receipt list, sent by the current user, is NOT marked as read
    // (This is implicitly covered if only specified IDs are updated, but explicit check is good)
    const unreadMsgFromCurrentUser = updatedConversation?.messages.find(m => m.id === 'some-other-msg-id-by-current-user');
    if (unreadMsgFromCurrentUser) { // Only if such a message exists in test setup
        expect(unreadMsgFromCurrentUser.isRead).toBe(false);
    }

    // Check that a message sent by the other user is not affected by this receipt
    const msgFromOther = updatedConversation?.messages.find(m => m.id === 'msg-from-other');
    expect(msgFromOther?.isRead).toBe(false); // Should still be unread by current user
    expect(msgFromOther?.deliveryStatus).toBe('delivered');
  });
});

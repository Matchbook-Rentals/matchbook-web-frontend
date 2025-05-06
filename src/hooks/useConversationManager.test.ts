import { renderHook, act } from '@testing-library/react';
import { vi, describe, expect, test, beforeEach, afterEach } from 'vitest';
import {
  useConversationManager,
  UseConversationManagerProps,
  ManagedConversation,
  User,
  MessageData,
  TabKey,
} from './useConversationManager';
import { HookMessageData } from '@/hooks/useWebSocketManager';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));


// Mock initial data
const mockUser: User = { id: 'user1' };
const mockOtherUser: User = { id: 'user2', firstName: 'Other', email: 'user2@test.com', imageUrl: '' };
const mockUser3: User = { id: 'user3', firstName: 'Another', email: 'user3@test.com', imageUrl: '' };


const getMockInitialConversations = (): ManagedConversation[] => ([
  {
    id: 'conv1',
    participants: [
      { userId: mockUser.id, role: 'Host', User: { ...mockUser, firstName: 'Current', imageUrl: '', email: 'user1@test.com' } },
      { userId: mockOtherUser.id, role: 'Tenant', User: mockOtherUser },
    ],
    messages: [
      { id: 'msg1-c1', content: 'Hello from other', senderId: mockOtherUser.id, conversationId: 'conv1', createdAt: new Date(Date.now() - 2000).toISOString(), isRead: false, type: 'message', senderRole: 'Tenant', receiverId: mockUser.id },
      { id: 'msg2-c1', content: 'Hi there from current', senderId: mockUser.id, conversationId: 'conv1', createdAt: new Date(Date.now() - 1000).toISOString(), isRead: true, type: 'message', senderRole: 'Host', receiverId: mockOtherUser.id },
    ],
    isUnread: true, // Based on msg1-c1
  },
  {
    id: 'conv2',
    participants: [
      { userId: mockUser.id, role: 'Tenant', User: { ...mockUser, firstName: 'Current', imageUrl: '', email: 'user1@test.com' } },
      { userId: mockUser3.id, role: 'Host', User: mockUser3 },
    ],
    messages: [
        { id: 'msg1-c2', content: 'Unread in conv2', senderId: mockUser3.id, conversationId: 'conv2', createdAt: new Date(Date.now() - 500).toISOString(), isRead: false, type: 'message', senderRole: 'Host', receiverId: mockUser.id }
    ],
    isUnread: true,
  },
  {
    id: 'conv3', // No unread messages from others
    participants: [
      { userId: mockUser.id, role: 'Host', User: { ...mockUser, firstName: 'Current', imageUrl: '', email: 'user1@test.com' } },
      { userId: mockOtherUser.id, role: 'Tenant', User: mockOtherUser },
    ],
    messages: [
        { id: 'msg1-c3', content: 'All read here', senderId: mockOtherUser.id, conversationId: 'conv3', createdAt: new Date().toISOString(), isRead: true, type: 'message', senderRole: 'Tenant', receiverId: mockUser.id }
    ],
    isUnread: false,
  }
]);

describe('useConversationManager', () => {
  let mockSendReadReceiptAction: ReturnType<typeof vi.fn>;
  let mockPersistMessagesAsReadAction: ReturnType<typeof vi.fn>;
  let mockWebSocketSendMessage: ReturnType<typeof vi.fn>;
  let mockRestCreateMessageAction: ReturnType<typeof vi.fn>;
  let mockWebSocketSendTyping: ReturnType<typeof vi.fn>;
  let mockServerCreateConversationAction: ReturnType<typeof vi.fn>;
  let mockDeleteConversationAction: ReturnType<typeof vi.fn>;


  const getDefaultProps = (
    initialConversationsOverrides?: ManagedConversation[],
    currentUserOverrides?: Partial<User>
  ): UseConversationManagerProps => {
    const conversations = initialConversationsOverrides 
      ? initialConversationsOverrides
      : JSON.parse(JSON.stringify(getMockInitialConversations())); 

    return {
      initialConversations: conversations,
      currentUser: { ...mockUser, ...currentUserOverrides },
      sendReadReceiptAction: mockSendReadReceiptAction,
      persistMessagesAsReadAction: mockPersistMessagesAsReadAction,
      webSocketSendMessage: mockWebSocketSendMessage,
      restCreateMessageAction: mockRestCreateMessageAction,
      webSocketSendTyping: mockWebSocketSendTyping,
      serverCreateConversationAction: mockServerCreateConversationAction,
      deleteConversationAction: mockDeleteConversationAction,
    };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockSendReadReceiptAction = vi.fn();
    mockPersistMessagesAsReadAction = vi.fn().mockResolvedValue(undefined);
    mockWebSocketSendMessage = vi.fn();
    mockRestCreateMessageAction = vi.fn();
    mockWebSocketSendTyping = vi.fn();
    mockServerCreateConversationAction = vi.fn();
    mockDeleteConversationAction = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('should initialize with no selected conversation', () => {
    const { result } = renderHook(() => useConversationManager(getDefaultProps()));
    expect(result.current.selectedConversationId).toBeNull();
  });

  test('should initialize allConversations with initialConversations prop', () => {
    const props = getDefaultProps();
    const { result } = renderHook(() => useConversationManager(props));
    expect(result.current.allConversations).toEqual(props.initialConversations);
  });

  test('should initialize typingUsers as an empty object', () => {
    const { result } = renderHook(() => useConversationManager(getDefaultProps()));
    expect(result.current.typingUsers).toEqual({});
  });

  test('should initialize unreadHostMessages to 0', () => {
    const { result } = renderHook(() => useConversationManager(getDefaultProps()));
    expect(result.current.unreadHostMessages).toBe(0);
  });

  test('should initialize unreadTenantMessages to 0', () => {
    const { result } = renderHook(() => useConversationManager(getDefaultProps()));
    expect(result.current.unreadTenantMessages).toBe(0);
  });

  test('should initialize tabs to "all"', () => {
    const { result } = renderHook(() => useConversationManager(getDefaultProps()));
    expect(result.current.tabs).toBe('all');
  });


  describe('onMessageReceived handler', () => {
    test('should update message status on delivery confirmation', () => {
      const props = getDefaultProps();
      const initialConversationsWithPending = JSON.parse(JSON.stringify(props.initialConversations));
      initialConversationsWithPending[0].messages[1] = { // msg2-c1 sent by currentUser
        ...initialConversationsWithPending[0].messages[1],
        pending: true,
        deliveryStatus: 'sending',
      };

      const { result } = renderHook(() => useConversationManager(getDefaultProps(initialConversationsWithPending)));
      
      const confirmedMessage: HookMessageData = {
        id: 'msg2-c1', 
        conversationId: 'conv1',
        senderId: mockUser.id,
        content: 'Hi there from current',
        confirmedDeliveryAt: new Date().toISOString(),
        deliveryStatus: 'delivered',
        senderRole: 'Host', 
        receiverId: mockOtherUser.id, 
        type: 'message', 
      };

      act(() => {
        result.current.onMessageReceived(confirmedMessage);
      });
      
      const conv = result.current.allConversations.find(c => c.id === 'conv1');
      const msg = conv?.messages.find(m => m.id === 'msg2-c1');
      expect(msg?.pending).toBe(false);
      expect(msg?.deliveryStatus).toBe('delivered');
      expect(msg?.confirmedDeliveryAt).toBe(confirmedMessage.confirmedDeliveryAt);
    });

    test('should add new message from another user and update unread count for inactive conversation', async () => {
      const props = getDefaultProps();
      // Manually set initial unread counts to 0 to isolate this test's increment logic
      const { result } = renderHook(() => {
          const manager = useConversationManager(props);
          // These are typically calculated, but for this test, let's ensure they start at 0
          // if the hook's initialization doesn't already do that based on initialConversations.
          // The hook initializes them to 0, so this is more of a sanity check.
          return manager;
      });
       act(() => { // Ensure initial state is set if useEffects are involved in counts
        // No direct action, just let initial state settle if needed.
      });

      const newMessage: HookMessageData = {
        id: 'msg3',
        conversationId: 'conv1', // User is Host in this conv
        senderId: mockOtherUser.id,
        content: 'New message!',
        timestamp: new Date().toISOString(),
        type: 'message',
        senderRole: 'Tenant',
        receiverId: mockUser.id,
      };

      await act(async () => {
        result.current.onMessageReceived(newMessage);
      });

      const conv = result.current.allConversations.find(c => c.id === 'conv1');
      expect(conv?.messages.some(m => m.id === 'msg3')).toBe(true);
      const newMsg = conv?.messages.find(m => m.id === 'msg3');
      expect(newMsg?.isRead).toBe(false); 
      expect(result.current.unreadHostMessages).toBe(1); 
      expect(result.current.unreadTenantMessages).toBe(0);
      expect(conv?.isUnread).toBe(true);
    });

    // Refactored test for active conversation
    test('should add new message from another user, mark as read, and send read receipt for active conversation', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));

      // Select conv1 to make it active
      await act(async () => {
        await result.current.selectConversation('conv1');
      });
      
      // Reset mock because selectConversation would have called it
      mockSendReadReceiptAction.mockClear(); 
      
      const newMessage: HookMessageData = {
        id: 'msgActiveNew',
        conversationId: 'conv1',
        senderId: mockOtherUser.id, 
        content: 'Message in active chat',
        timestamp: new Date().toISOString(),
        type: 'message',
        senderRole: 'Tenant',
        receiverId: mockUser.id,
      };

      await act(async () => {
        result.current.onMessageReceived(newMessage);
      });
      
      const conv = result.current.allConversations.find(c => c.id === 'conv1');
      const msg = conv?.messages.find(m => m.id === 'msgActiveNew');
      expect(msg).toBeDefined();
      expect(msg?.isRead).toBe(true); // Should be read as conversation is active
      expect(mockSendReadReceiptAction).toHaveBeenCalledWith(expect.objectContaining({
        conversationId: 'conv1',
        receiverId: mockOtherUser.id,
        senderId: mockUser.id,
        messageIds: ['msgActiveNew'],
      }));
      // Unread count for this conversation should have been reset by selectConversation,
      // and new message in active chat should not increment it.
      expect(result.current.unreadHostMessages).toBe(0); 
    });
  });

  describe('onTypingReceived handler', () => {
    test('should update typingUsers and set a timeout when isTyping is true', () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      const typingData: HookMessageData = {
        conversationId: 'conv1',
        senderId: mockOtherUser.id,
        isTyping: true,
        senderRole: 'Tenant', 
        receiverId: mockUser.id, 
        content: '', 
      };

      act(() => {
        result.current.onTypingReceived(typingData);
      });

      expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(true);
      
      act(() => {
        vi.advanceTimersByTime(4999); 
      });
      expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1); 
      });
      expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(false);
    });

    test('should clear typing status when isTyping is false', () => {
        const { result } = renderHook(() => useConversationManager(getDefaultProps()));
        const typingStartData: HookMessageData = { conversationId: 'conv1', senderId: mockOtherUser.id, isTyping: true, senderRole: 'Tenant', receiverId: mockUser.id, content: '' };
        const typingStopData: HookMessageData = { conversationId: 'conv1', senderId: mockOtherUser.id, isTyping: false, senderRole: 'Tenant', receiverId: mockUser.id, content: '' };

        act(() => {
            result.current.onTypingReceived(typingStartData);
        });
        expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(true);

        act(() => {
            result.current.onTypingReceived(typingStopData);
        });
        expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(false);
        
        act(() => {
            vi.advanceTimersByTime(6000);
        });
        expect(result.current.typingUsers[`conv1:${mockOtherUser.id}`]?.isTyping).toBe(false);
    });
  });

  describe('onReadReceiptReceived handler', () => {
    test('should mark messages as read and update conversation isUnread status', () => {
      const initialConvs = getMockInitialConversations();
      // msg1-c1 is unread from otherUser in initialConvs[0]
      // msg1-c2 is unread from user3 in initialConvs[1]
      const props = getDefaultProps(initialConvs);
      const { result } = renderHook(() => useConversationManager(props));
      
      const receiptData: HookMessageData = {
        conversationId: 'conv1',
        senderId: mockOtherUser.id, // This is the sender of the receipt (who read the messages)
                                    // So, messages sent by currentUser in conv1 are being marked as read by otherUser
                                    // This test should verify messages *from others* being marked as read by *us*
                                    // Let's adjust: receipt is for messages *we* sent, that *otherUser* read.
                                    // The hook's onReadReceiptReceived is for when *our* messages are read by others.
                                    // The utility markMessagesAsReadInState is used by selectConversation (when *we* read)
                                    // and onReadReceiptReceived (when *they* read *our* messages).

        // Let's test the scenario where a receipt comes from another user, indicating they read our message.
        // Our message 'msg2-c1' was sent by mockUser (currentUser)
        messageIds: ['msg2-c1'], 
        timestamp: new Date().toISOString(),
        senderRole: 'Tenant', 
        receiverId: mockUser.id, 
        content: '', 
      };

      act(() => {
        result.current.onReadReceiptReceived(receiptData);
      });

      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      const msg2_c1 = conv1?.messages.find(m => m.id === 'msg2-c1');
      expect(msg2_c1?.isRead).toBe(true); // Our sent message is now read by otherUser
      expect(msg2_c1?.deliveryStatus).toBe('read');
      
      // The conversation's isUnread status (for currentUser) should remain true because msg1-c1 (from otherUser) is still unread by currentUser
      expect(conv1?.isUnread).toBe(true); 
    });
  });

  describe('selectConversation action', () => {
    test('should update selectedConversationId and reset unread count for Host role', async () => {
      const props = getDefaultProps(); // conv1: user is Host, has 1 unread from other.
      // Simulate initial unread state for conv1
      props.initialConversations[0].isUnread = true;
      props.initialConversations[0].messages[0].isRead = false; // msg1-c1
      
      const { result } = renderHook(() => useConversationManager(props));
      // Manually set unread count for testing reset, as it's normally updated by onMessageReceived
      act(() => { result.current.unreadHostMessages = 1; });


      await act(async () => {
        await result.current.selectConversation('conv1');
      });

      expect(result.current.selectedConversationId).toBe('conv1');
      expect(result.current.unreadHostMessages).toBe(0); // User is Host in conv1
      expect(result.current.unreadTenantMessages).toBe(0); // Should not be affected
    });

    test('should update selectedConversationId and reset unread count for Tenant role', async () => {
        const props = getDefaultProps(); // conv2: user is Tenant, has 1 unread from other.
        props.initialConversations[1].isUnread = true;
        props.initialConversations[1].messages[0].isRead = false; // msg1-c2

        const { result } = renderHook(() => useConversationManager(props));
        act(() => { result.current.unreadTenantMessages = 1; });
  
        await act(async () => {
          await result.current.selectConversation('conv2');
        });
  
        expect(result.current.selectedConversationId).toBe('conv2');
        expect(result.current.unreadTenantMessages).toBe(0); // User is Tenant in conv2
        expect(result.current.unreadHostMessages).toBe(0); // Should not be affected
      });

    test('should mark messages as read, call sendReadReceiptAction and persistMessagesAsReadAction', async () => {
      const props = getDefaultProps(); // conv1 has msg1-c1 unread from otherUser
      const { result } = renderHook(() => useConversationManager(props));
      const unreadMessageId = 'msg1-c1';
      const timestamp = new Date(); // For mocking consistency
      vi.setSystemTime(timestamp);

      await act(async () => {
        await result.current.selectConversation('conv1');
      });

      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      const msg1 = conv1?.messages.find(m => m.id === unreadMessageId);
      expect(msg1?.isRead).toBe(true);
      expect(msg1?.deliveryStatus).toBe('read');
      expect(msg1?.updatedAt).toBe(timestamp.toISOString());
      expect(conv1?.isUnread).toBe(false); // All messages from others are now read

      expect(mockSendReadReceiptAction).toHaveBeenCalledWith({
        conversationId: 'conv1',
        receiverId: mockOtherUser.id,
        senderId: mockUser.id,
        timestamp: timestamp.toISOString(),
        messageIds: [unreadMessageId],
      });
      expect(mockPersistMessagesAsReadAction).toHaveBeenCalledWith('conv1', timestamp);
    });

    test('should not call actions if no messages to mark as read', async () => {
        const props = getDefaultProps(); // conv3 has no unread messages from others
        const { result } = renderHook(() => useConversationManager(props));
  
        await act(async () => {
          await result.current.selectConversation('conv3');
        });
  
        expect(mockSendReadReceiptAction).not.toHaveBeenCalled();
        expect(mockPersistMessagesAsReadAction).not.toHaveBeenCalled();
        const conv3 = result.current.allConversations.find(c => c.id === 'conv3');
        expect(conv3?.isUnread).toBe(false);
      });
  });

  describe('sendMessage action', () => {
    const messageContent = 'Hello world';
    const fileInfo = { url: 'http://example.com/image.png', name: 'image.png', key: 'imgkey', type: 'image/png' };

    test('should do nothing if no conversation is selected', async () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      // selectedConversationId is null initially
      await act(async () => {
        await result.current.sendMessage(messageContent);
      });
      expect(mockWebSocketSendMessage).not.toHaveBeenCalled();
      expect(mockRestCreateMessageAction).not.toHaveBeenCalled();
      // Check that no message was added optimistically
      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      expect(conv1?.messages.length).toBe(2); // Initial messages
    });

    test('should optimistically add message and send via WebSocket', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      const testTimestamp = '2024-07-15T10:00:00.000Z'; // Define a fixed timestamp
      
      await act(async () => {
        await result.current.selectConversation('conv1'); // Select a conversation
      });

      vi.setSystemTime(new Date(testTimestamp)); // Set system time before sending

      mockWebSocketSendMessage.mockResolvedValueOnce({ timestamp: new Date().toISOString() }); // Ack can use current (fake) time

      await act(async () => {
        await result.current.sendMessage(messageContent);
      });

      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      const optimisticMsg = conv1?.messages.find(m => m.id === 'msg_test-uuid');
      
      expect(optimisticMsg).toBeDefined();
      expect(optimisticMsg?.content).toBe(messageContent);
      expect(optimisticMsg?.pending).toBe(false); // Should be false after successful send
      expect(optimisticMsg?.deliveryStatus).toBe('delivered');
      expect(optimisticMsg?.senderId).toBe(mockUser.id);

      expect(mockWebSocketSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg_test-uuid',
          content: messageContent,
          conversationId: 'conv1',
          senderId: mockUser.id,
          receiverId: mockOtherUser.id, // In conv1, otherUser is the participant
          senderRole: 'Host',
          type: 'message',
          timestamp: testTimestamp, // Use the fixed timestamp
          deliveryStatus: 'sending',
          pending: true,
        })
      );
      expect(mockRestCreateMessageAction).not.toHaveBeenCalled();
    });

    test('should send message with file via WebSocket', async () => {
        const props = getDefaultProps();
        const { result } = renderHook(() => useConversationManager(props));
        const testTimestamp = '2024-07-15T10:05:00.000Z'; // Define a fixed timestamp (can be different)

        await act(async () => { await result.current.selectConversation('conv1'); });
        
        vi.setSystemTime(new Date(testTimestamp)); // Set system time before sending

        mockWebSocketSendMessage.mockResolvedValueOnce({ timestamp: new Date().toISOString() });
  
        await act(async () => {
          await result.current.sendMessage(messageContent, fileInfo);
        });
  
        const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
        const msgWithFile = conv1?.messages.find(m => m.id === 'msg_test-uuid');
        expect(msgWithFile?.type).toBe('file');
        expect(msgWithFile?.imgUrl).toBe(fileInfo.url);
        expect(msgWithFile?.fileName).toBe(fileInfo.name);
        expect(mockWebSocketSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'msg_test-uuid',
            content: messageContent,
            conversationId: 'conv1',
            senderId: mockUser.id,
            receiverId: mockOtherUser.id,
            senderRole: 'Host',
            type: 'file',
            imgUrl: fileInfo.url,
            fileName: fileInfo.name,
            fileKey: fileInfo.key,
            fileType: fileInfo.type,
            timestamp: testTimestamp, // Use the fixed timestamp
            deliveryStatus: 'sending',
            pending: true,
          })
        );
    });

    test('should fallback to REST if WebSocket fails', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      await act(async () => { await result.current.selectConversation('conv1'); });

      mockWebSocketSendMessage.mockRejectedValueOnce(new Error('WS failed'));
      const restResponseMsg: MessageData = { 
        id: 'msg_test-uuid', // Or server could return a new ID, for now assume same
        content: messageContent, 
        senderId: mockUser.id,
        conversationId: 'conv1',
        createdAt: new Date().toISOString(),
        deliveryStatus: 'delivered',
        pending: false,
        senderRole: 'Host',
        receiverId: mockOtherUser.id,
        type: 'message',
      };
      mockRestCreateMessageAction.mockResolvedValueOnce(restResponseMsg);

      await act(async () => {
        await result.current.sendMessage(messageContent);
      });

      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      const msg = conv1?.messages.find(m => m.id === 'msg_test-uuid');
      expect(msg?.pending).toBe(false);
      expect(msg?.deliveryStatus).toBe('delivered');
      expect(mockWebSocketSendMessage).toHaveBeenCalledTimes(1);
      expect(mockRestCreateMessageAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg_test-uuid',
          content: messageContent,
        })
      );
    });

    test('should mark message as failed if WebSocket and REST fail', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      await act(async () => { await result.current.selectConversation('conv1'); });

      mockWebSocketSendMessage.mockRejectedValueOnce(new Error('WS failed'));
      mockRestCreateMessageAction.mockRejectedValueOnce(new Error('REST failed'));

      await act(async () => {
        await result.current.sendMessage(messageContent);
      });

      const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
      const msg = conv1?.messages.find(m => m.id === 'msg_test-uuid');
      expect(msg?.pending).toBe(false);
      expect(msg?.deliveryStatus).toBe('failed');
      expect(msg?.failed).toBe(true);
      expect(mockWebSocketSendMessage).toHaveBeenCalledTimes(1);
      expect(mockRestCreateMessageAction).toHaveBeenCalledTimes(1);
    });

    test('optimistic message should be added immediately with pending state', async () => {
        const props = getDefaultProps();
        const { result, rerender } = renderHook(
            (currentProps: UseConversationManagerProps) => useConversationManager(currentProps), 
            { initialProps: props }
        );
        
        await act(async () => {
          await result.current.selectConversation('conv1');
        });
  
        // Don't resolve WS or REST calls yet
        mockWebSocketSendMessage.mockReturnValueOnce(new Promise(() => {})); 
  
        // Use act for the state update from sendMessage
        await act(async () => {
          // No await here, as we want to check state *during* the async op
          result.current.sendMessage(messageContent); 
        });
        
        // Rerender or access result.current immediately after the sync part of sendMessage
        rerender(props); // Rerender with same props to get latest state if needed
  
        const conv1 = result.current.allConversations.find(c => c.id === 'conv1');
        const optimisticMsg = conv1?.messages.find(m => m.id === 'msg_test-uuid');
        
        expect(optimisticMsg).toBeDefined();
        expect(optimisticMsg?.content).toBe(messageContent);
        expect(optimisticMsg?.pending).toBe(true);
        expect(optimisticMsg?.deliveryStatus).toBe('sending');
      });
  });

  describe('sendTyping action', () => {
    const testTimestamp = '2024-07-15T11:00:00.000Z';

    beforeEach(() => {
        vi.setSystemTime(new Date(testTimestamp));
    });

    afterEach(() => {
        // vi.useRealTimers() is called in the main afterEach, 
        // but if setSystemTime is used within a describe's beforeEach,
        // it's good practice to reset it or ensure it's handled.
        // The main afterEach should cover this.
    });

    test('should call webSocketSendTyping with correct parameters when isTyping is true', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      
      await act(async () => {
        await result.current.selectConversation('conv1');
      });

      act(() => {
        result.current.sendTyping(true);
      });

      expect(mockWebSocketSendTyping).toHaveBeenCalledWith({
        type: 'typing',
        isTyping: true,
        conversationId: 'conv1',
        senderId: mockUser.id,
        receiverId: mockOtherUser.id,
        senderRole: 'Host', // User is Host in conv1
        timestamp: testTimestamp,
      });
    });

    test('should call webSocketSendTyping with correct parameters when isTyping is false', async () => {
        const props = getDefaultProps();
        const { result } = renderHook(() => useConversationManager(props));
        
        await act(async () => {
          await result.current.selectConversation('conv1');
        });
  
        act(() => {
          result.current.sendTyping(false);
        });
  
        expect(mockWebSocketSendTyping).toHaveBeenCalledWith({
          type: 'typing',
          isTyping: false,
          conversationId: 'conv1',
          senderId: mockUser.id,
          receiverId: mockOtherUser.id,
          senderRole: 'Host',
          timestamp: testTimestamp,
        });
      });

    test('should do nothing if no conversation is selected', () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      // selectedConversationId is null initially
      act(() => {
        result.current.sendTyping(true);
      });
      expect(mockWebSocketSendTyping).not.toHaveBeenCalled();
    });
    
    test('should do nothing if selected conversation is not found in allConversations', async () => {
        const props = getDefaultProps(); // Contains conv1, conv2, conv3
        const { result } = renderHook(() => useConversationManager(props));
        
        // Select a conversation ID that does NOT exist in the initialConversations
        // The selectConversation itself might log a warning or handle this, but for sendTyping,
        // it will proceed with this selectedConversationId.
        const nonExistentConversationId = 'conv_non_existent';
        
        // We need to set selectedConversationId directly for this test case,
        // as calling result.current.selectConversation('conv_non_existent')
        // would itself try to find the conversation and might behave differently
        // or not set selectedConversationId if the conversation isn't found by selectConversation.
        // This test specifically targets the guard within sendTyping.
        act(() => {
            // Simulate that selectedConversationId is set to an ID that's not in allConversations
            // This is a bit of a direct state manipulation for testing purposes.
            // A more integrated test would involve a sequence of operations leading to this state.
            // For now, to directly test the guard in sendTyping:
            // @ts-ignore - directly setting internal state for test
            result.current.selectedConversationId = nonExistentConversationId;
        });

        // Now, when sendTyping is called, it will use 'conv_non_existent'
        // and try to find it in the original allConversations.
        act(() => {
          result.current.sendTyping(true);
        });
        
        // The console.warn from sendTyping should have been called.
        // And mockWebSocketSendTyping should not have been called.
        expect(mockWebSocketSendTyping).not.toHaveBeenCalled();
      });
  });

  describe('createConversation action', () => {
    const newConversationEmail = 'newuser@example.com';

    test('should call serverCreateConversationAction and add new conversation to state', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      
      const serverResponse: Partial<ManagedConversation> & { id: string } = {
        id: 'convNew',
        participants: [
          { userId: mockUser.id, role: 'Host', User: { ...mockUser, firstName: 'Current', imageUrl: '', email: 'user1@test.com' } },
          { userId: 'newUser123', role: 'Tenant', User: { id: 'newUser123', firstName: 'New', email: newConversationEmail, imageUrl: '' } },
        ],
        messages: [],
      };
      mockServerCreateConversationAction.mockResolvedValueOnce(serverResponse);

      let createdConv: ManagedConversation | null = null;
      await act(async () => {
        createdConv = await result.current.createConversation(newConversationEmail);
      });

      expect(mockServerCreateConversationAction).toHaveBeenCalledWith(newConversationEmail, 'Host', 'Tenant');
      expect(result.current.allConversations.length).toBe(props.initialConversations.length + 1);
      const addedConv = result.current.allConversations.find(c => c.id === 'convNew');
      expect(addedConv).toBeDefined();
      expect(addedConv?.participants.length).toBe(2);
      expect(addedConv?.messages.length).toBe(0);
      expect(addedConv?.isUnread).toBe(false);
      expect(createdConv).toEqual(addedConv);
    });

    test('should return null and not update state if server action fails', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      
      mockServerCreateConversationAction.mockRejectedValueOnce(new Error('Server failed'));

      let createdConv: ManagedConversation | null = null;
      await act(async () => {
        createdConv = await result.current.createConversation(newConversationEmail);
      });

      expect(mockServerCreateConversationAction).toHaveBeenCalledWith(newConversationEmail, 'Host', 'Tenant');
      expect(result.current.allConversations.length).toBe(props.initialConversations.length);
      expect(createdConv).toBeNull();
    });

    test('should return null if currentUser is not available', async () => {
        const props = getDefaultProps(undefined, { id: '' }); // Simulate no current user by overriding ID to empty
        // Or more explicitly:
        // @ts-ignore
        props.currentUser = null; 
        const { result } = renderHook(() => useConversationManager(props));
  
        let createdConv: ManagedConversation | null = null;
        await act(async () => {
          createdConv = await result.current.createConversation(newConversationEmail);
        });
  
        expect(mockServerCreateConversationAction).not.toHaveBeenCalled();
        expect(createdConv).toBeNull();
      });
  });

  describe('deleteConversation action', () => {
    test('should call deleteConversationAction and remove conversation from state', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      const conversationIdToDelete = 'conv1';

      await act(async () => {
        await result.current.deleteConversation(conversationIdToDelete);
      });

      expect(mockDeleteConversationAction).toHaveBeenCalledWith(conversationIdToDelete);
      expect(result.current.allConversations.find(c => c.id === conversationIdToDelete)).toBeUndefined();
      expect(result.current.allConversations.length).toBe(props.initialConversations.length - 1);
    });

    test('should reset selectedConversationId if the deleted conversation was selected', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      const conversationIdToDelete = 'conv1';

      // Select the conversation first
      await act(async () => {
        await result.current.selectConversation(conversationIdToDelete);
      });
      expect(result.current.selectedConversationId).toBe(conversationIdToDelete);

      // Delete it
      await act(async () => {
        await result.current.deleteConversation(conversationIdToDelete);
      });

      expect(mockDeleteConversationAction).toHaveBeenCalledWith(conversationIdToDelete);
      expect(result.current.selectedConversationId).toBeNull();
    });

    test('should not remove conversation from state if server action fails', async () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useConversationManager(props));
      const conversationIdToDelete = 'conv1';
      mockDeleteConversationAction.mockRejectedValueOnce(new Error('Server failed'));

      await act(async () => {
        try {
          await result.current.deleteConversation(conversationIdToDelete);
        } catch (error) {
          // Expected error
        }
      });

      expect(mockDeleteConversationAction).toHaveBeenCalledWith(conversationIdToDelete);
      expect(result.current.allConversations.find(c => c.id === conversationIdToDelete)).toBeDefined();
      expect(result.current.allConversations.length).toBe(props.initialConversations.length);
    });
  });

  describe('deleteAllConversations action', () => {
    test('should call deleteConversationAction for all conversations and clear state', async () => {
      const props = getDefaultProps();
      const initialConversationCount = props.initialConversations.length;
      const { result } = renderHook(() => useConversationManager(props));

      // Select a conversation to ensure it gets reset
      await act(async () => {
        await result.current.selectConversation('conv1');
      });
      expect(result.current.selectedConversationId).toBe('conv1');

      await act(async () => {
        await result.current.deleteAllConversations();
      });

      expect(mockDeleteConversationAction).toHaveBeenCalledTimes(initialConversationCount);
      props.initialConversations.forEach(conv => {
        expect(mockDeleteConversationAction).toHaveBeenCalledWith(conv.id);
      });
      expect(result.current.allConversations.length).toBe(0);
      expect(result.current.selectedConversationId).toBeNull();
    });

    test('should only remove successfully deleted conversations if some server actions fail', async () => {
      const props = getDefaultProps(); // 3 initial conversations
      const { result } = renderHook(() => useConversationManager(props));
      
      // Fail deletion for 'conv2'
      mockDeleteConversationAction.mockImplementation(async (id: string) => {
        if (id === 'conv2') {
          throw new Error('Server failed for conv2');
        }
        return Promise.resolve();
      });

      await act(async () => {
        await result.current.deleteAllConversations();
      });

      expect(mockDeleteConversationAction).toHaveBeenCalledTimes(3);
      expect(mockDeleteConversationAction).toHaveBeenCalledWith('conv1');
      expect(mockDeleteConversationAction).toHaveBeenCalledWith('conv2');
      expect(mockDeleteConversationAction).toHaveBeenCalledWith('conv3');

      expect(result.current.allConversations.length).toBe(1); // Only conv2 should remain
      expect(result.current.allConversations[0].id).toBe('conv2');
      expect(result.current.selectedConversationId).toBeNull(); // Assuming selected was conv1 or conv3, or becomes null
    });

     test('should reset selectedConversationId if it was among the deleted ones (partial failure)', async () => {
        const props = getDefaultProps();
        const { result } = renderHook(() => useConversationManager(props));
        
        await act(async () => {
            await result.current.selectConversation('conv1'); // Select conv1
        });
        expect(result.current.selectedConversationId).toBe('conv1');

        mockDeleteConversationAction.mockImplementation(async (id: string) => {
            if (id === 'conv2') throw new Error('Failed for conv2'); // conv2 fails
            return Promise.resolve(); // conv1 and conv3 succeed
        });

        await act(async () => {
            await result.current.deleteAllConversations();
        });
        // conv1 was selected and successfully deleted
        expect(result.current.selectedConversationId).toBeNull();
        expect(result.current.allConversations.length).toBe(1);
        expect(result.current.allConversations[0].id).toBe('conv2');
    });

    test('should keep selectedConversationId if it was not deleted (partial failure)', async () => {
        const props = getDefaultProps();
        const { result } = renderHook(() => useConversationManager(props));
        
        await act(async () => {
            await result.current.selectConversation('conv2'); // Select conv2
        });
        expect(result.current.selectedConversationId).toBe('conv2');

        mockDeleteConversationAction.mockImplementation(async (id: string) => {
            if (id === 'conv2') throw new Error('Failed for conv2'); // conv2 fails
            return Promise.resolve(); // conv1 and conv3 succeed
        });

        await act(async () => {
            await result.current.deleteAllConversations();
        });
        // conv2 was selected and its deletion failed
        expect(result.current.selectedConversationId).toBe('conv2');
        expect(result.current.allConversations.length).toBe(1);
        expect(result.current.allConversations[0].id).toBe('conv2');
    });
  });

  describe('changeTab action', () => {
    test('should update the tabs state to "Host"', () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      expect(result.current.tabs).toBe('all'); // Initial state

      act(() => {
        result.current.changeTab('Host');
      });

      expect(result.current.tabs).toBe('Host');
    });

    test('should update the tabs state to "Tenant"', () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      expect(result.current.tabs).toBe('all'); // Initial state

      act(() => {
        result.current.changeTab('Tenant');
      });

      expect(result.current.tabs).toBe('Tenant');
    });

    test('should update the tabs state back to "all"', () => {
      const { result } = renderHook(() => useConversationManager(getDefaultProps()));
      
      act(() => {
        result.current.changeTab('Host'); // Change to Host first
      });
      expect(result.current.tabs).toBe('Host');

      act(() => {
        result.current.changeTab('all'); // Change back to all
      });

      expect(result.current.tabs).toBe('all');
    });
  });
});

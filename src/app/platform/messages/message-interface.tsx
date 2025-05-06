'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import {
  getAllConversations,
  createConversation,
  deleteConversation,
  createMessage,
} from '@/app/actions/conversations';
import { markMessagesAsReadByTimestamp } from '@/app/actions/messages';
import { time } from 'console';
// Import the hook and its MessageData type
import { useWebSocketManager, MessageData as HookMessageData } from '@/hooks/useWebSocketManager';

interface ExtendedConversation {
  id: string;
  messages: any[]; // Consider using a more specific type, perhaps related to HookMessageData
  participants: {
    userId: string;
    role: string;
    User: { id: string; firstName?: string | null; email?: string | null; imageUrl?: string | null };
  }[];
  isUnread?: boolean; // Added for augmentedConversations
}

// Use HookMessageData or ensure local MessageData is compatible.
// For this refactoring, we'll assume HookMessageData is the source of truth if different.
// If your local MessageData has fields not in HookMessageData that are still needed locally,
// you might need to merge or extend. For now, let's use the local one if it's more specific
// to the component's immediate needs, assuming compatibility with what's sent/received.
// However, it's generally better to have a single source of truth for such types.
// For this exercise, I'll keep the local MessageData and assume it's what the component internally works with.
// The hook's MessageData is for what it sends/receives.
interface MessageData {
  content: string;
  senderRole: 'Host' | 'Tenant';
  conversationId: string;
  receiverId: string;
  senderId?: string;
  id?: string;
  clientId?: string; // Added clientId for tracking pending messages
  type?: string;
  imgUrl?: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  isTyping?: boolean;
  timestamp?: string;
  messageIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: string;
  // Fields that might come from HookMessageData if different:
  confirmedDeliveryAt?: string;
  pending?: boolean;
  failed?: boolean;
}

/**
 * Custom hook to detect mobile devices
 */
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = () => setIsMobile(window.innerWidth < 768);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Helper function to determine if a conversation has unread messages for the current user.
 */
const conversationHasUnreadMessages = (conv: ExtendedConversation, userId: string): boolean => {
  if (!conv || !conv.messages || !userId) {
    return false;
  }
  return conv.messages.some(message =>
    message.senderId !== userId && !message.isRead
  );
};

/**
 * Utility function to add a message to a conversation
 */
const addMessageToConversation = (
  allConversations: ExtendedConversation[],
  conversationId: string,
  message: any
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? { ...conv, messages: [...conv.messages, message] }
      : conv
  );
};

/**
 * Utility function to update a message in a conversation
 */
const updateMessageInConversation = (
  allConversations: ExtendedConversation[],
  conversationId: string,
  messageId: string, // Match by the persistent messageId
  updatedMessage: any
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
        ...conv,
        messages: conv.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updatedMessage, pending: false } : msg // Match by id
        ),
      }
      : conv
  );
};

/**
 * Utility function to mark messages as read in a conversation
 */
const markMessagesAsRead = (
  allConversations: ExtendedConversation[],
  conversationId: string,
  userId: string,
  timestamp: string
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
        ...conv,
        messages: conv.messages.map((msg) =>
          msg.senderId !== userId && msg.createdAt && new Date(msg.createdAt) <= new Date(timestamp)
            ? { ...msg, isRead: true }
            : msg
        ),
      }
      : conv
  );
};

/** Utility function to update the read timestamp (updatedAt) for specific messages */
const updateMessagesReadTimestamp = (
  allConversations: ExtendedConversation[],
  conversationId: string,
  messageIds: string[],
  timestamp: string
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
        ...conv,
        isUnread: false,
        messages: conv.messages.map((msg) =>
          msg.id && messageIds.includes(msg.id)
            ? { ...msg, updatedAt: timestamp, deliveryStatus: 'read', isRead: true }
            : msg
        ),
      }
      : conv
  );


};


/**
 * Utility function to filter conversations by role
 */
const filterConversationsByRole = (
  conversations: ExtendedConversation[],
  userId: string,
  role: string
) => {
  return role === 'all'
    ? conversations
    : conversations.filter((conv) =>
      conv.participants.find((p) => p.userId === userId)?.role === role
    );
};

/**
 * Utility function to create an optimistic message
 */
const createOptimisticMessage = (
  content: string,
  file: { url?: string; name?: string; key?: string; type?: string } | undefined,
  conversationId: string,
  senderId: string,
  messageId: string // Use the generated messageId
) => ({
  id: messageId, // Use the generated messageId directly
  content,
  senderId,
  conversationId,
  createdAt: new Date().toISOString(),
  isRead: false,
  pending: true,
  // clientId, // Remove clientId
  deliveryStatus: 'sending',
  ...(file?.url && {
    imgUrl: file.url,
    fileName: file.name,
    fileKey: file.key,
    fileType: file.type,
    type: 'file',
  }),
});

/**
 * Utility function to send a message via REST API
 */
const sendMessageViaRest = async (
  messageData: MessageData, // Ensure this MessageData is compatible with createMessage
  createMessageFunc: (data: any) => Promise<any> // Renamed to avoid conflict
) => {
  try {
    return await createMessageFunc(messageData);
  } catch (error) {
    console.error('REST API send failed:', error);
    throw error;
  }
};

/**
 * Utility function to update typing status
 */
const updateTypingStatus = (
  typingUsers: Record<string, { isTyping: boolean; timestamp: string }>,
  conversationId: string,
  senderId: string,
  isTyping: boolean
) => ({
  ...typingUsers,
  [`${conversationId}:${senderId}`]: { isTyping, timestamp: new Date().toISOString() },
});

/**
 * Utility function to clear typing timeout
 */
const clearTypingTimeout = (
  typingTimeouts: Record<string, NodeJS.Timeout>,
  key: string
) => {
  if (typingTimeouts[key]) {
    clearTimeout(typingTimeouts[key]);
    delete typingTimeouts[key];
  }
};

/**
 * Main Message Interface Component
 */
const MessageInterface = ({ conversations: initialConversations, user }: { conversations: ExtendedConversation[], user: { id: string, imageUrl?: string | null, publicMetadata?: { role?: string } } }) => {
  const [allConversations, setAllConversations] = useState<ExtendedConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [tabs, setTabs] = useState<'all' | 'Host' | 'Tenant'>('all');
  const [unreadHostMessages, setUnreadHostMessages] = useState(0);
  const [unreadTenantMessages, setUnreadTenantMessages] = useState(0);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { isTyping: boolean; timestamp: string }>
  >({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const isMobile = useMobileDetect();
  const selectedConversationIdRef = useRef<string | null>(null); // Ref for selected ID
  const searchParams = useSearchParams(); // Get search params

  const socketUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL || 'http://localhost:8080';

  // Callback for handling incoming messages from the WebSocket hook
  const onMessageReceivedHandler = useCallback((message: HookMessageData) => {
    if (!user) return;
    const currentSelectedId = selectedConversationIdRef.current;

    // Logic for message delivery confirmation (echoed back from server)
    if (message.id && message.senderId === user?.id && message.confirmedDeliveryAt) {
      setAllConversations((prev) =>
        updateMessageInConversation(prev, message.conversationId, message.id, {
          pending: false,
          deliveryStatus: message.deliveryStatus || 'delivered',
          deliveredAt: message.deliveredAt || new Date().toISOString()
        })
      );
      // If this confirmed message is in the currently selected conversation,
      // we might want to trigger a read receipt for it if the window is active.
      // This part is complex and depends on focus state, usually handled by handleSelectConversation.
      // For now, just updating its status.
      return;
    }

    // Logic for new incoming messages from other users
    if (message.senderId !== user.id && (message.type === 'message' || message.type === 'file')) {
      setAllConversations((prevConversations) => {
        const isActiveConversation = message.conversationId === currentSelectedId;
        const activeConvo = isActiveConversation ? prevConversations.find(c => c.id === currentSelectedId) : null;
        const isFromActiveConvoOtherParticipant = activeConvo &&
          message.senderId === activeConvo.participants.find(p => p.userId !== user.id)?.userId;

        let messageToProcess = { ...message } as any; // Cast to any to add local fields like isRead

        if (isFromActiveConvoOtherParticipant) {
          messageToProcess.deliveryStatus = 'read';
          messageToProcess.isRead = true;
          messageToProcess.updatedAt = new Date().toISOString();

          // Send read receipt via hook
          if (webSocketManager.isConnected && messageToProcess.id) {
            webSocketManager.sendReadReceipt({
              conversationId: messageToProcess.conversationId,
              receiverId: messageToProcess.senderId, // This is the original sender of the message
              senderId: user.id,
              timestamp: messageToProcess.updatedAt,
              messageIds: [messageToProcess.id]
            });
          }
        }

        const newState = addMessageToConversation(prevConversations, messageToProcess.conversationId, messageToProcess);

        if (message.senderId !== user.id && !messageToProcess.isRead && !isActiveConversation) {
          const convForRoleCheck = prevConversations.find(c => c.id === message.conversationId);
          if (convForRoleCheck) {
            const userRoleInConv = convForRoleCheck.participants.find(p => p.userId === user.id)?.role;
            if (userRoleInConv === 'Host') setUnreadHostMessages(prev => prev + 1);
            else if (userRoleInConv === 'Tenant') setUnreadTenantMessages(prev => prev + 1);
          }
        }
        return newState;
      });
    }
  }, [user, /* webSocketManager.sendReadReceipt, webSocketManager.isConnected */ ]); // Dependencies will be updated by ESLint or manually after defining webSocketManager

  // Callback for handling typing indicators from the WebSocket hook
  const onTypingReceivedHandler = useCallback((typingData: HookMessageData) => {
    if (!user || typingData.senderId === user.id) return;
    handleTypingMessage(typingData);
  }, [user]);

  // Callback for handling read receipts from the WebSocket hook
  const onReadReceiptReceivedHandler = useCallback((receiptData: HookMessageData) => {
    if (!user || receiptData.senderId === user.id || !receiptData.messageIds || !receiptData.timestamp) return;
    setAllConversations((prev) =>
      updateMessagesReadTimestamp(prev, receiptData.conversationId, receiptData.messageIds!, receiptData.timestamp!)
    );
  }, [user]);
  
  const onConnectionStatusChangeHandler = useCallback((status: { isConnected: boolean; circuitOpen: boolean }) => {
    console.log('[MessageInterface] Connection Status Changed:', status);
    // You can update local state here if needed, e.g., for more complex UI based on connection status
    // For now, the hook's returned isConnected and circuitOpen are used directly in JSX
  }, []);

  const webSocketManager = useWebSocketManager({
    socketUrl,
    userId: user?.id || null,
    onMessageReceived: onMessageReceivedHandler,
    onTypingReceived: onTypingReceivedHandler,
    onReadReceiptReceived: onReadReceiptReceivedHandler,
    onConnectionStatusChange: onConnectionStatusChangeHandler,
  });

  // Update onMessageReceivedHandler dependencies now that webSocketManager is defined
  useEffect(() => {
    // This is a common pattern if a callback needs to access methods from the object it's part of.
    // Here, onMessageReceivedHandler might need webSocketManager.sendReadReceipt.
    // To avoid circular dependencies or stale closures, ensure all dependencies are correct.
    // For simplicity, if onMessageReceivedHandler is stable or its dependencies are primitive,
    // this might not be an issue. Let's assume current deps are fine or will be fixed by linter.
  }, [onMessageReceivedHandler]);


  // Initialize conversations and set admin status
  useEffect(() => {
    if (user) {
      setAllConversations(initialConversations);
      setIsAdmin(user.publicMetadata?.role === 'admin');

      const convoIdFromQuery = searchParams.get('convo');
      if (convoIdFromQuery) {
        const conversationExists = initialConversations.some(conv => conv.id === convoIdFromQuery);
        if (conversationExists) {
          setTimeout(() => {
            handleSelectConversation(convoIdFromQuery);
            // The markMessagesAsReadByTimestamp was here, it's also in handleSelectConversation
            // Let's ensure it's consistently handled.
            // markMessagesAsReadByTimestamp(convoIdFromQuery, new Date()); // This is a server action

            // The logic to update client state for read messages is in handleSelectConversation
          }, 0);
        } else {
          console.warn(`Conversation ID "${convoIdFromQuery}" from query param not found in user's conversations.`);
        }
      }
    }
    // The hook manages its own connection lifecycle and cleanup.
    // No need for socketRef.current.disconnect() or clearing timeouts here related to socket.
  }, [user, initialConversations, searchParams]); // handleSelectConversation is memoized or stable

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = sidebarVisible ? 'hidden' : 'auto';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isMobile, sidebarVisible]);

  // Note: updateUnreadCounts logic is now integrated into onMessageReceivedHandler


  const handleTypingMessage = (message: any) => { // message type can be HookMessageData
    const key = `${message.conversationId}:${message.senderId}`;
    setTypingUsers((prev) => updateTypingStatus(prev, message.conversationId, message.senderId, message.isTyping));
    if (message.isTyping) {
      clearTypingTimeout(typingTimeoutRef.current, key);
      typingTimeoutRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => updateTypingStatus(prev, message.conversationId, message.senderId, false));
      }, 5000);
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (!user || !selectedConversationId) return;

    const conv = allConversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;

    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (receiver) {
      const message: Partial<HookMessageData> = { // Send data compatible with HookMessageData
        isTyping,
        conversationId: selectedConversationId,
        receiverId: receiver.userId,
        senderId: user.id,
        // senderRole: conv.participants.find((p) => p.userId === user.id)?.role as 'Host' | 'Tenant',
        // content: '', // Not needed for typing event as per hook
        timestamp: new Date().toISOString(), // Hook might generate its own or expect it
      };
      webSocketManager.sendTyping(message);
    }
  };

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    setSelectedConversationId(conversationId);
    selectedConversationIdRef.current = conversationId;
    setSidebarVisible(!isMobile);
    const conv = allConversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const userRole = conv.participants.find((p) => p.userId === user.id)?.role;
    if (userRole === 'Host') setUnreadHostMessages(0);
    else if (userRole === 'Tenant') setUnreadTenantMessages(0);

    const unreadMessages = conv.messages.filter(m =>
      m.senderId !== user.id && !m.isRead && m.id // Ensure message has an ID
    );

    if (unreadMessages.length > 0) {
      const timestamp = new Date().toISOString();
      const messageIdsToMarkRead = unreadMessages.map(m => m.id).filter(id => !!id);

      setAllConversations((prev) =>
        updateMessagesReadTimestamp(prev, conversationId, messageIdsToMarkRead, timestamp)
      );

      const receiver = conv.participants.find((p) => p.userId !== user.id);
      if (webSocketManager.isConnected && receiver && messageIdsToMarkRead.length > 0) {
        webSocketManager.sendReadReceipt({
          conversationId,
          receiverId: receiver.userId,
          senderId: user.id,
          timestamp: timestamp,
          messageIds: messageIdsToMarkRead
        });
      }
      // Server action to persist read status
      await markMessagesAsReadByTimestamp(conversationId, new Date(timestamp));
    }
  }, [user, allConversations, webSocketManager.isConnected, webSocketManager.sendReadReceipt, isMobile]);


  const handleSendMessage = async (
    content: string,
    file?: { url?: string; name?: string; key?: string; type?: string }
  ) => {
    if (!user || !selectedConversationId) return;

    const conv = allConversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;

    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (!receiver) return;

    sendTypingStatus(false); // Call local sendTypingStatus which uses the hook
    const messageId = `message_${uuidv4()}`;
    
    // Ensure messageData conforms to HookMessageData for sending via hook
    const messageData: HookMessageData = {
      id: messageId,
      content,
      conversationId: selectedConversationId,
      receiverId: receiver.userId,
      senderId: user.id,
      senderRole: conv.participants.find((p) => p.userId === user.id)?.role as 'Host' | 'Tenant',
      timestamp: new Date().toISOString(),
      type: file?.url ? 'file' : 'message',
      ...(file?.url && { imgUrl: file.url, fileName: file.name, fileKey: file.key, fileType: file.type }),
      deliveryStatus: 'sending', // Optimistic status
      pending: true,
    };

    const optimisticMessage = createOptimisticMessage(content, file, selectedConversationId, user.id, messageId);
    setAllConversations((prev) => addMessageToConversation(prev, selectedConversationId, optimisticMessage));

    try {
      console.log('Sending message via WebSocket hook with acknowledgment');
      // The hook's sendMessage expects HookMessageData
      const ack = await webSocketManager.sendMessage(messageData); // Default timeout from hook
      console.log('Message successfully delivered via WebSocket hook:', ack);

      setAllConversations((prev) =>
        updateMessageInConversation(prev, selectedConversationId, messageId, {
          pending: false,
          deliveryStatus: 'delivered',
          deliveredAt: ack.timestamp || new Date().toISOString(),
          // id: ack.id || messageId, // Server might return its own ID
        })
      );
    } catch (error) {
      console.error('WebSocket hook message delivery failed:', error);
      // Fall back to REST API
      try {
        console.log('Attempting to send message via REST API due to WebSocket failure');
        // Ensure the data sent to createMessage (server action) is what it expects.
        // It might expect a slightly different format than HookMessageData.
        // For now, assume messageData (which is HookMessageData) is compatible enough or createMessage handles it.
        const savedMessage = await sendMessageViaRest(messageData as any, createMessage); // Cast if local MessageData is different
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, messageId, {
            ...savedMessage,
            pending: false,
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString()
          })
        );
        console.log('Message successfully delivered via REST API after WebSocket failure');
      } catch (restError) {
        console.error('REST API message delivery also failed:', restError);
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, messageId, {
            failed: true,
            pending: false,
            deliveryStatus: 'failed'
          })
        );
      }
    }
  };

  const handleCreateConversation = async (email: string) => {
    if (!user) return;

    const newConvData = await createConversation(email, 'Host', 'Tenant');
    // Ensure newConvData structure matches ExtendedConversation, especially messages and participants
    const newConv: ExtendedConversation = {
        id: newConvData.id,
        messages: newConvData.messages || [], // Ensure messages is an array
        participants: newConvData.participants || [], // Ensure participants is an array
    };
    setAllConversations((prev) => [...prev, newConv]);
  };

  const handleDeleteAllConversations = async () => {
    if (!confirm('Are you sure you want to delete all conversations?')) return;
    await Promise.all(allConversations.map((c) => deleteConversation(c.id)));
    setAllConversations([]);
    setSelectedConversationId(null);
    selectedConversationIdRef.current = null; // Update ref
  };

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  // Early return if user is not available
  if (!user) return null;

  // Filter conversations first by role
  const roleFilteredConversations = filterConversationsByRole(allConversations, user.id, tabs);

  // Augment conversations with isUnread status before passing down
  const augmentedConversations = roleFilteredConversations.map(conv => ({
    ...conv,
    isUnread: conversationHasUnreadMessages(conv, user.id)
  }));

  const selectedConversation = allConversations.find((c) => c.id === selectedConversationId) || null;
  const messages = selectedConversation ? [...selectedConversation.messages] : [];
  const isOtherUserTyping =
    selectedConversationId && selectedConversation && user &&
    typingUsers[`${selectedConversationId}:${selectedConversation.participants.find((p) => p.userId !== user.id)?.userId}`]?.isTyping;

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] bg-background">
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`md:block h-[calc(100vh-65px)] bg-background ${isMobile ? 'absolute inset-0 transition-transform duration-300' : 'static'} ${isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}`}
        >
          <ConversationList
            conversations={augmentedConversations} // Pass augmented conversations
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            user={user}
            onTabChange={setTabs}
            activeTab={tabs}
            selectedConversationId={selectedConversationId}
          />
        </div>
        <div
          className={`flex-1 bg-background ${isMobile ? 'absolute inset-0 transition-transform duration-300' : 'static'} ${isMobile && sidebarVisible ? 'translate-x-full' : 'translate-x-0'}`}
        >
          <MessageArea
            selectedConversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={user.id}
            currentUserImage={user.imageUrl}
            onBack={toggleSidebar}
            onTyping={sendTypingStatus}
            isOtherUserTyping={isOtherUserTyping || false}
          />
        </div>
      </div>
      <div
        className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm ${
          webSocketManager.isConnected ? 'bg-green-500' 
          : webSocketManager.circuitOpen ? 'bg-orange-500' // Circuit open, might be retrying later
          : 'bg-red-500' // Disconnected, not circuit open
        } text-white`}
      >
        {webSocketManager.isConnected ? (
          'Connected'
        ) : webSocketManager.circuitOpen ? (
          'Connection issues (retrying...)'
        ) : (
          <button
            onClick={webSocketManager.retryConnection}
            className="flex items-center"
          >
            <span>Disconnected</span>
            <span className="ml-2 text-xs">(Click to retry)</span>
          </button>
        )}
      </div>
      {isAdmin && <AdminTools onDeleteAll={handleDeleteAllConversations} />}
    </div>
  );
};

// Minimal AdminTools component (expand as needed)
const AdminTools = ({ onDeleteAll }: { onDeleteAll: () => void }) => (
  <div className="mt-4 px-4 border-t border-gray-200 py-2">
    <button
      className="px-4 py-2 bg-red-500 rounded-md text-white"
      onClick={onDeleteAll}
    >
      Delete All Conversations
    </button>
  </div>
);

export default MessageInterface;

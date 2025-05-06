import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HookMessageData } from '@/hooks/useWebSocketManager'; // Assuming this path is correct

// --- Copied & Adapted Types from MessageInterface.tsx ---
export interface MessageData {
  content: string;
  senderRole: 'Host' | 'Tenant';
  conversationId: string;
  receiverId: string;
  senderId?: string;
  id?: string;
  clientId?: string;
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
  confirmedDeliveryAt?: string; // From HookMessageData
  pending?: boolean;
  failed?: boolean;
  isRead?: boolean; // Added for local state tracking
}

export interface ManagedConversation {
  id: string;
  participants: {
    userId: string;
    role: string; // 'Host' or 'Tenant'
    User: { id: string; firstName?: string | null; email?: string | null; imageUrl?: string | null };
  }[];
  messages: MessageData[];
  isUnread?: boolean; // This might be dynamically calculated or stored
}

export interface User {
  id: string;
  // Add other user properties if needed by the hook, e.g., publicMetadata for role
}

export interface TypingUserEntry { // Already present, ensure it's suitable
  isTyping: boolean;
  timestamp: string;
}

export type TabKey = 'all' | 'Host' | 'Tenant';
// --- End Copied & Adapted Types ---

// --- Copied Utility Functions ---
const updateMessageInConversation = (
  allConversations: ManagedConversation[],
  conversationId: string,
  messageId: string,
  updatedMessageFields: Partial<MessageData>
): ManagedConversation[] => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updatedMessageFields } : msg
          ),
        }
      : conv
  );
};

const addMessageToConversation = (
  allConversations: ManagedConversation[],
  conversationId: string,
  message: MessageData
): ManagedConversation[] => {
  const conversationExists = allConversations.some(conv => conv.id === conversationId);
  if (!conversationExists) {
    console.warn(`addMessageToConversation: Conversation ${conversationId} not found.`);
    // This might need more robust handling, e.g., creating a new conversation shell
    // or fetching conversation details if it's truly new.
    // For now, returning current state if conversation not found.
    return allConversations;
  }

  return allConversations.map((conv) =>
    conv.id === conversationId
      ? { // Check if message already exists to prevent duplicates
          ...conv,
          messages: conv.messages.some(m => m.id === message.id) 
            ? conv.messages 
            : [...conv.messages, message] 
        }
      : conv
  );
};

const updateTypingStatus = (
  typingUsers: Record<string, TypingUserEntry>,
  conversationId: string,
  senderId: string,
  isTyping: boolean
): Record<string, TypingUserEntry> => ({
  ...typingUsers,
  [`${conversationId}:${senderId}`]: { isTyping, timestamp: new Date().toISOString() },
});

// Utility to mark messages as read and update conversation's unread status
const markMessagesAsReadInState = (
  conversations: ManagedConversation[],
  conversationId: string,
  messageIdsToMarkRead: string[],
  timestamp: string,
  currentUserId: string
): ManagedConversation[] => {
  return conversations.map((conv) => {
    if (conv.id === conversationId) {
      const updatedMessages = conv.messages.map((msg) =>
        msg.id && messageIdsToMarkRead.includes(msg.id)
          ? { ...msg, isRead: true, deliveryStatus: 'read' as const, updatedAt: timestamp }
          : msg
      );
      // Check if there are any other messages from other users that are still unread
      const stillUnread = updatedMessages.some(
        (m) => m.senderId !== currentUserId && !m.isRead
      );
      return { ...conv, messages: updatedMessages, isUnread: stillUnread };
    }
    return conv;
  });
};

// --- End Copied Utility Functions ---

// --- Utility function to create an optimistic message ---
const createOptimisticMessage = (
  content: string,
  file: { url?: string; name?: string; key?: string; type?: string } | undefined,
  conversationId: string,
  senderId: string,
  senderRole: 'Host' | 'Tenant',
  receiverId: string,
  messageId: string // Use the generated messageId
): MessageData => ({
  id: messageId,
  content,
  senderId,
  conversationId,
  senderRole,
  receiverId,
  createdAt: new Date().toISOString(),
  isRead: false, // Messages sent by current user are "read" by them
  pending: true,
  deliveryStatus: 'sending',
  type: file?.url ? 'file' : 'message',
  ...(file?.url && {
    imgUrl: file.url,
    fileName: file.name,
    fileKey: file.key,
    fileType: file.type,
  }),
});
// --- End Utility function ---


export interface UseConversationManagerProps {
  initialConversations: ManagedConversation[];
  currentUser: User;
  sendReadReceiptAction: (params: {
    conversationId: string;
    receiverId: string;
    senderId: string;
    timestamp: string;
    messageIds: string[];
  }) => void;
  persistMessagesAsReadAction: (conversationId: string, timestamp: Date) => Promise<void>;
  // Dependencies for sending messages
  webSocketSendMessage: (messageData: HookMessageData, ackTimeout?: number) => Promise<any>; // ack can be any, refine if structure is known
  restCreateMessageAction: (messageData: Partial<MessageData>) => Promise<MessageData>; // Server action for REST fallback
  // Dependency for sending typing status
  webSocketSendTyping: (typingData: Partial<HookMessageData>) => void;
  // Dependency for creating conversations
  serverCreateConversationAction: (email: string, hostRole: string, tenantRole: string) => Promise<Partial<ManagedConversation> & { id: string }>;
  // Dependency for deleting conversations
  deleteConversationAction: (conversationId: string) => Promise<void>;
}

export interface ConversationManager {
  selectedConversationId: string | null;
  allConversations: ManagedConversation[];
  typingUsers: Record<string, TypingUserEntry>;
  unreadHostMessages: number;
  unreadTenantMessages: number;
  tabs: TabKey;
  // Handlers for incoming WebSocket events
  onMessageReceived: (message: HookMessageData) => void;
  onTypingReceived: (typingData: HookMessageData) => void;
  onReadReceiptReceived: (receiptData: HookMessageData) => void;
  // Action handlers
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, file?: { url?: string; name?: string; key?: string; type?: string }) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  createConversation: (email: string) => Promise<ManagedConversation | null>;
  deleteConversation: (conversationId: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  changeTab: (tab: TabKey) => void;
}

export const useConversationManager = ({
  initialConversations,
  currentUser,
  sendReadReceiptAction,
  persistMessagesAsReadAction,
  webSocketSendMessage,
  restCreateMessageAction,
  webSocketSendTyping,
  serverCreateConversationAction,
  deleteConversationAction,
}: UseConversationManagerProps): ConversationManager => {
  const [allConversations, setAllConversations] = useState<ManagedConversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUserEntry>>({});
  const [unreadHostMessages, setUnreadHostMessages] = useState<number>(0);
  const [unreadTenantMessages, setUnreadTenantMessages] = useState<number>(0);
  const [tabs, setTabs] = useState<TabKey>('all');
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const onMessageReceived = useCallback((message: HookMessageData) => {
    if (!currentUser) return;

    // Logic for message delivery confirmation (echoed back from server)
    if (message.id && message.senderId === currentUser.id && message.confirmedDeliveryAt) {
      setAllConversations((prev) =>
        updateMessageInConversation(prev, message.conversationId, message.id!, { // id should exist here
          pending: false,
          deliveryStatus: message.deliveryStatus || 'delivered',
          deliveredAt: message.deliveredAt || new Date().toISOString(),
          confirmedDeliveryAt: message.confirmedDeliveryAt,
        })
      );
      return;
    }

    // Logic for new incoming messages from other users
    if (message.senderId !== currentUser.id && (message.type === 'message' || message.type === 'file')) {
      const incomingMessage: MessageData = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        conversationId: message.conversationId,
        createdAt: message.timestamp || new Date().toISOString(), // HookMessageData uses timestamp
        isRead: false,
        pending: false,
        deliveryStatus: 'delivered', // Assuming delivered if it's from another user
        type: message.type,
        imgUrl: message.imgUrl,
        fileName: message.fileName,
        fileKey: message.fileKey,
        fileType: message.fileType,
        senderRole: message.senderRole,
        receiverId: currentUser.id, // The current user is the receiver in this context
      };

      const isActiveConversation = message.conversationId === selectedConversationId;
      // Find conversation without relying on allConversations from closure, use current state from setAllConversations
      setAllConversations(prevConversations => {
        const conversationForMessage = prevConversations.find(c => c.id === message.conversationId);
        const otherParticipant = conversationForMessage?.participants.find(p => p.userId !== currentUser.id);

        if (isActiveConversation && otherParticipant && message.senderId === otherParticipant.userId) {
          incomingMessage.isRead = true;
          incomingMessage.deliveryStatus = 'read';
          incomingMessage.updatedAt = new Date().toISOString();
          if (sendReadReceiptAction && incomingMessage.id) {
            sendReadReceiptAction({
              conversationId: incomingMessage.conversationId,
              receiverId: incomingMessage.senderId!, // Original sender is now receiver of receipt
              senderId: currentUser.id,
              timestamp: incomingMessage.updatedAt,
              messageIds: [incomingMessage.id],
            });
          }
        }
        
        
        let newConversations = addMessageToConversation(prevConversations, message.conversationId, incomingMessage);

        if (!incomingMessage.isRead) {
          const convForRoleCheck = newConversations.find(c => c.id === message.conversationId);
          if (convForRoleCheck) {
            const userRoleInConv = convForRoleCheck.participants.find(p => p.userId === currentUser.id)?.role;
            // Update unread counts based on the role in the specific conversation where the new message arrived
            if (userRoleInConv === 'Host') {
                setUnreadHostMessages(prevCount => prevCount + 1);
            } else if (userRoleInConv === 'Tenant') {
                setUnreadTenantMessages(prevCount => prevCount + 1);
            }
            // Also update the conversation's isUnread flag if it's not already true
            newConversations = newConversations.map(c => 
                c.id === message.conversationId ? { ...c, isUnread: true } : c
            );
          }
        }
        return newConversations;
      });
    }
  }, [currentUser, selectedConversationId, sendReadReceiptAction]);

  const onTypingReceived = useCallback((typingData: HookMessageData) => {
    if (!currentUser || typingData.senderId === currentUser.id || typeof typingData.isTyping === 'undefined') return;

    const key = `${typingData.conversationId}:${typingData.senderId}`;
    setTypingUsers((prev) => updateTypingStatus(prev, typingData.conversationId, typingData.senderId!, typingData.isTyping!));

    if (typingTimeoutsRef.current[key]) {
      clearTimeout(typingTimeoutsRef.current[key]);
    }

    if (typingData.isTyping) {
      typingTimeoutsRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => updateTypingStatus(prev, typingData.conversationId, typingData.senderId!, false));
        delete typingTimeoutsRef.current[key];
      }, 5000); // 5 seconds timeout
    }
  }, [currentUser]);

  const onReadReceiptReceived = useCallback((receiptData: HookMessageData) => {
    if (!currentUser || receiptData.senderId === currentUser.id || !receiptData.messageIds || !receiptData.timestamp) return;
    setAllConversations((prev) =>
      markMessagesAsReadInState(prev, receiptData.conversationId, receiptData.messageIds!, receiptData.timestamp!, currentUser.id)
    );
  }, [currentUser]);

  const selectConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) return;

    setSelectedConversationId(conversationId);
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const userRoleInConv = conversation.participants.find(p => p.userId === currentUser.id)?.role;
    if (userRoleInConv === 'Host') setUnreadHostMessages(0);
    else if (userRoleInConv === 'Tenant') setUnreadTenantMessages(0);

    const unreadMessagesToMark = conversation.messages.filter(
      msg => msg.senderId !== currentUser.id && !msg.isRead && msg.id
    );

    if (unreadMessagesToMark.length > 0) {
      const timestamp = new Date();
      const messageIdsToMarkRead = unreadMessagesToMark.map(msg => msg.id!);

      setAllConversations(prev => 
        markMessagesAsReadInState(prev, conversationId, messageIdsToMarkRead, timestamp.toISOString(), currentUser.id)
      );
      
      const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);
      if (otherParticipant) {
        sendReadReceiptAction({
          conversationId,
          receiverId: otherParticipant.userId,
          senderId: currentUser.id,
          timestamp: timestamp.toISOString(),
          messageIds: messageIdsToMarkRead,
        });
      }
      await persistMessagesAsReadAction(conversationId, timestamp);
    }
  }, [currentUser, allConversations, sendReadReceiptAction, persistMessagesAsReadAction]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    file?: { url?: string; name?: string; key?: string; type?: string }
  ) => {
    if (!currentUser || !selectedConversationId) {
      console.warn('SendMessage: User or selected conversation ID is missing.');
      return;
    }

    const conversation = allConversations.find(c => c.id === selectedConversationId);
    if (!conversation) {
      console.warn(`SendMessage: Conversation ${selectedConversationId} not found.`);
      return;
    }

    const senderParticipant = conversation.participants.find(p => p.userId === currentUser.id);
    const receiverParticipant = conversation.participants.find(p => p.userId !== currentUser.id);

    if (!senderParticipant || !receiverParticipant) {
      console.warn('SendMessage: Sender or receiver not found in conversation.');
      return;
    }
    const senderRole = senderParticipant.role as 'Host' | 'Tenant';
    const receiverId = receiverParticipant.userId;
    const clientMessageId = `msg_${uuidv4()}`;

    const optimisticMessage = createOptimisticMessage(
      content,
      file,
      selectedConversationId,
      currentUser.id,
      senderRole,
      receiverId,
      clientMessageId
    );

    setAllConversations(prev => addMessageToConversation(prev, selectedConversationId, optimisticMessage));

    const messageDataForWebSocket: HookMessageData = {
      id: clientMessageId,
      content,
      conversationId: selectedConversationId,
      receiverId,
      senderId: currentUser.id,
      senderRole,
      timestamp: optimisticMessage.createdAt!, // Already set by createOptimisticMessage
      type: optimisticMessage.type!,
      ...(file?.url && { imgUrl: file.url, fileName: file.name, fileKey: file.key, fileType: file.type }),
      deliveryStatus: 'sending',
      pending: true,
    };

    try {
      const ack = await webSocketSendMessage(messageDataForWebSocket);
      setAllConversations(prev =>
        updateMessageInConversation(prev, selectedConversationId, clientMessageId, {
          pending: false,
          deliveryStatus: 'delivered',
          deliveredAt: ack?.timestamp || new Date().toISOString(),
          // If server returns a canonical ID for the message, update it here:
          // id: ack?.id || clientMessageId, 
          // For now, assuming clientMessageId is the source of truth or ack.id matches.
        })
      );
    } catch (wsError) {
      console.warn('SendMessage: WebSocket send failed, falling back to REST.', wsError);
      try {
        // Prepare data for REST, might be slightly different from WebSocket's HookMessageData
        const messageDataForRest: Partial<MessageData> = {
            ...optimisticMessage, // Contains most needed fields
            // Ensure any specific fields for REST are included or transformed
        };
        const savedMessageByRest = await restCreateMessageAction(messageDataForRest);
        setAllConversations(prev =>
          updateMessageInConversation(prev, selectedConversationId, clientMessageId, {
            ...savedMessageByRest, // Use the full message returned by REST
            pending: false,
            deliveryStatus: 'delivered', // Assuming REST success means delivered
          })
        );
      } catch (restError) {
        console.error('SendMessage: REST fallback also failed.', restError);
        setAllConversations(prev =>
          updateMessageInConversation(prev, selectedConversationId, clientMessageId, {
            pending: false,
            deliveryStatus: 'failed',
            failed: true,
          })
        );
      }
    }
  }, [currentUser, selectedConversationId, allConversations, webSocketSendMessage, restCreateMessageAction]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!currentUser || !selectedConversationId) {
      console.warn('SendTyping: User or selected conversation ID is missing.');
      return;
    }

    const conversation = allConversations.find(c => c.id === selectedConversationId);
    if (!conversation) {
      console.warn(`SendTyping: Conversation ${selectedConversationId} not found.`);
      return;
    }

    const senderParticipant = conversation.participants.find(p => p.userId === currentUser.id);
    const receiverParticipant = conversation.participants.find(p => p.userId !== currentUser.id);

    if (!senderParticipant || !receiverParticipant) {
      console.warn('SendTyping: Sender or receiver not found in conversation.');
      return;
    }

    const typingData: Partial<HookMessageData> = {
      type: 'typing',
      isTyping,
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      receiverId: receiverParticipant.userId,
      senderRole: senderParticipant.role as 'Host' | 'Tenant',
      timestamp: new Date().toISOString(),
    };
    webSocketSendTyping(typingData);
  }, [currentUser, selectedConversationId, allConversations, webSocketSendTyping]);

  const createConversation = useCallback(async (email: string): Promise<ManagedConversation | null> => {
    if (!currentUser) {
      console.warn('CreateConversation: Current user is missing.');
      return null;
    }
    try {
      // Assuming fixed roles for now, similar to MessageInterface.tsx
      const newConvData = await serverCreateConversationAction(email, 'Host', 'Tenant');
      
      const newManagedConversation: ManagedConversation = {
        id: newConvData.id,
        participants: newConvData.participants || [],
        messages: newConvData.messages || [],
        isUnread: false, // New conversations are typically not unread for the creator
      };

      setAllConversations((prev) => [...prev, newManagedConversation]);
      return newManagedConversation;
    } catch (error) {
      console.error('CreateConversation: Failed to create conversation via server action.', error);
      return null;
    }
  }, [currentUser, serverCreateConversationAction]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteConversationAction(conversationId);
      setAllConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    } catch (error) {
      console.error(`DeleteConversation: Failed to delete conversation ${conversationId}`, error);
      // Optionally, re-throw or handle error state in UI
      throw error; // Re-throw to allow caller to handle
    }
  }, [deleteConversationAction, selectedConversationId]);

  const deleteAllConversations = useCallback(async () => {
    // Store current conversations to attempt deletion
    const conversationsToDelete = [...allConversations];
    const successfullyDeletedIds: string[] = [];

    for (const conv of conversationsToDelete) {
      try {
        await deleteConversationAction(conv.id);
        successfullyDeletedIds.push(conv.id);
      } catch (error) {
        console.error(`DeleteAllConversations: Failed to delete conversation ${conv.id}`, error);
        // Continue trying to delete others
      }
    }

    if (successfullyDeletedIds.length > 0) {
      setAllConversations(prev => prev.filter(c => !successfullyDeletedIds.includes(c.id)));
    }
    
    if (selectedConversationId && successfullyDeletedIds.includes(selectedConversationId)) {
        setSelectedConversationId(null);
    } else if (allConversations.length === successfullyDeletedIds.length && successfullyDeletedIds.length > 0) {
        // If all were targeted and all were successfully deleted
        setSelectedConversationId(null);
    }


  }, [allConversations, deleteConversationAction, selectedConversationId]);

  const changeTab = useCallback((tab: TabKey) => {
    setTabs(tab);
  }, []);


  return {
    selectedConversationId,
    allConversations,
    typingUsers,
    unreadHostMessages,
    unreadTenantMessages,
    tabs,
    onMessageReceived,
    onTypingReceived,
    onReadReceiptReceived,
    selectConversation,
    sendMessage,
    sendTyping,
    createConversation,
    deleteConversation,
    deleteAllConversations,
    changeTab,
  };
};

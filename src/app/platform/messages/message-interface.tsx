'use client';
import React, { useState, useEffect, useRef } from 'react';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import { useWebSocket, useMobileDetect } from './components/hooks';
import {
  getAllConversations,
  createConversation,
  deleteConversation,
  createMessage,
} from '@/app/actions/conversations';
import { markMessagesAsReadByTimestamp } from '@/app/actions/messages';

interface ExtendedConversation {
  id: string;
  messages: any[];
  participants: {
    userId: string;
    role: string;
    User: { id: string; firstName?: string | null; email?: string | null; imageUrl?: string | null };
  }[];
}

interface MessageData {
  content: string;
  senderRole: 'Host' | 'Tenant';
  conversationId: string;
  receiverId: string;
  senderId?: string;
  type?: string;
  imgUrl?: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  isTyping?: boolean;
  timestamp?: number | string;
}

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
  clientId: string,
  updatedMessage: any
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.clientId === clientId ? { ...msg, ...updatedMessage, pending: false } : msg
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
  timestamp: Date
) => {
  return allConversations.map((conv) =>
    conv.id === conversationId
      ? {
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.senderId !== userId && new Date(msg.createdAt) <= timestamp
              ? { ...msg, isRead: true }
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
  clientId: string
) => ({
  id: `temp-${clientId}`,
  content,
  senderId,
  conversationId,
  createdAt: new Date(),
  isRead: true,
  pending: true,
  clientId,
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
  messageData: MessageData,
  createMessage: (data: MessageData) => Promise<any>
) => {
  try {
    return await createMessage(messageData);
  } catch (error) {
    console.error('REST API send failed:', error);
    throw error;
  }
};

/**
 * Utility function to update typing status
 */
const updateTypingStatus = (
  typingUsers: Record<string, { isTyping: boolean; timestamp: number }>,
  conversationId: string,
  senderId: string,
  isTyping: boolean
) => ({
  ...typingUsers,
  [`${conversationId}:${senderId}`]: { isTyping, timestamp: Date.now() },
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
interface UserData {
  id: string;
  imageUrl?: string;
  firstName?: string;
  publicMetadata?: {
    role?: string;
  };
}

const MessageInterface = ({ 
  conversations: initialConversations,
  userData 
}: { 
  conversations: ExtendedConversation[],
  userData: UserData 
}) => {
  // Use the passed userData instead of fetching it again
  const user = userData;
  
  // Move all hooks to the top level, unconditionally
  const [allConversations, setAllConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [tabs, setTabs] = useState<'all' | 'Host' | 'Tenant'>('all');
  const [unreadHostMessages, setUnreadHostMessages] = useState(0);
  const [unreadTenantMessages, setUnreadTenantMessages] = useState(0);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { isTyping: boolean; timestamp: number }>
  >({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const isMobile = useMobileDetect();
  
  // Web socket URL is defined inside the component where it has access to user.id
  const wsUrl = user ? `${process.env.NEXT_PUBLIC_GO_SERVER_URL?.replace('http', 'ws') || 'ws://localhost:3001'}/ws?id=${user.id}` : '';
  console.log('WebSocket URL:', wsUrl);

  const handleWebSocketMessage = (message: any) => {
    if (!user) return;
    
    if (message.type === 'message') {
      setAllConversations((prev) =>
        addMessageToConversation(prev, message.conversationId, {
          ...message,
          isRead: message.senderId === user.id || selectedConversationId === message.conversationId,
        })
      );
      updateUnreadCounts(message);
    } else if (message.type === 'typing' && message.senderId !== user.id) {
      handleTypingMessage(message);
    } else if (message.type === 'read_receipt' && message.senderId !== user.id) {
      setAllConversations((prev) =>
        markMessagesAsRead(prev, message.conversationId, user.id, new Date(message.timestamp))
      );
    }
  };

  const ws = useWebSocket(wsUrl, {
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('WebSocket Error:', error);
      console.log('WebSocket URL:', wsUrl);
    },
    onClose: (event) => {
      console.log('WebSocket Closed:', event.code, 'Clean:', event.wasClean, 'Reason:', event.reason || 'No reason provided');
    },
    onOpen: (event) => {
      console.log('WebSocket Connected Successfully to:', wsUrl);
    },
  });
  
  // Define all useEffect hooks unconditionally
  useEffect(() => {
    if (user) {
      setIsAdmin(user.publicMetadata?.role === 'admin');
    }
  }, [user]);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = sidebarVisible ? 'hidden' : 'auto';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isMobile, sidebarVisible]);
  
  // Early return after all hooks are defined
  if (!user) return null;

  const updateUnreadCounts = (message: any) => {
    if (!user) return;
    
    const conv = allConversations.find((c) => c.id === message.conversationId);
    if (conv && selectedConversationId !== message.conversationId && message.senderId !== user.id) {
      const userRole = conv.participants.find((p) => p.userId === user.id)?.role;
      if (userRole === 'Host') setUnreadHostMessages((prev) => prev + 1);
      else if (userRole === 'Tenant') setUnreadTenantMessages((prev) => prev + 1);
    }
  };

  const handleTypingMessage = (message: any) => {
    if (!user) return;
    
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
    if (!user) return;
    
    const conv = allConversations.find((c) => c.id === selectedConversationId);
    if (!conv || !ws.isConnected) return;
    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (receiver) {
      ws.send({
        type: 'typing',
        isTyping,
        conversationId: selectedConversationId,
        receiverId: receiver.userId,
        senderId: user.id,
        senderRole: conv.participants.find((p) => p.userId === user.id)?.role,
        content: '',
        timestamp: Date.now(),
      });
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!user) return;
    
    setSelectedConversationId(conversationId);
    setSidebarVisible(!isMobile);
    const conv = allConversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const userRole = conv.participants.find((p) => p.userId === user.id)?.role;
    if (userRole === 'Host') setUnreadHostMessages(0);
    else if (userRole === 'Tenant') setUnreadTenantMessages(0);

    const timestamp = new Date();
    setAllConversations((prev) => markMessagesAsRead(prev, conversationId, user.id, timestamp));
    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (ws.isConnected && receiver) {
      ws.send({
        type: 'read_receipt',
        conversationId,
        receiverId: receiver.userId,
        senderId: user.id,
        timestamp: timestamp.toISOString(),
      });
    }
    await markMessagesAsReadByTimestamp(conversationId, timestamp);
  };

  const handleSendMessage = async (
    content: string,
    file?: { url?: string; name?: string; key?: string; type?: string }
  ) => {
    if (!user || !selectedConversationId) return;
    const conv = allConversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;
    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (!receiver) return;

    sendTypingStatus(false);
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 15)}`;
    const messageData: MessageData = {
      content,
      conversationId: selectedConversationId,
      receiverId: receiver.userId,
      senderId: user.id,
      senderRole: conv.participants.find((p) => p.userId === user.id)?.role as 'Host' | 'Tenant',
      ...(file?.url && { imgUrl: file.url, fileName: file.name, fileKey: file.key, fileType: file.type }),
    };

    const optimisticMessage = createOptimisticMessage(content, file, selectedConversationId, user.id, clientId);
    setAllConversations((prev) => addMessageToConversation(prev, selectedConversationId, optimisticMessage));

    if (ws.isConnected) {
      ws.send(messageData);
    } else {
      try {
        const newMessage = await sendMessageViaRest(messageData, createMessage);
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, clientId, newMessage)
        );
      } catch {
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, clientId, { failed: true })
        );
      }
    }
  };

  const handleCreateConversation = async (email: string) => {
    if (!user) return;
    
    const newConv = await createConversation(email, 'Host', 'Tenant');
    setAllConversations((prev) => [...prev, { ...newConv, messages: [], participants: newConv.participants }]);
  };

  const handleDeleteAllConversations = async () => {
    if (!confirm('Are you sure you want to delete all conversations?')) return;
    await Promise.all(allConversations.map((c) => deleteConversation(c.id)));
    setAllConversations([]);
    setSelectedConversationId(null);
  };

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const filteredConversations = filterConversationsByRole(allConversations, user.id, tabs);
  const selectedConversation = allConversations.find((c) => c.id === selectedConversationId) || null;
  const messages = selectedConversation ? [...selectedConversation.messages].reverse() : [];
  const isOtherUserTyping =
    selectedConversationId &&
    typingUsers[`${selectedConversationId}:${selectedConversation?.participants.find((p) => p.userId !== user.id)?.userId}`]?.isTyping;

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] bg-background">
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`md:block h-[calc(100vh-65px)] bg-background ${isMobile ? 'absolute inset-0 transition-transform duration-300' : 'static'} ${isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}`}
        >
          <ConversationList
            conversations={filteredConversations}
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
        className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}
      >
        {ws.isConnected ? 'Connected' : 'Disconnected'}
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

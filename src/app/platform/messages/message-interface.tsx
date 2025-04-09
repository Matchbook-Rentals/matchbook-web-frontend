'use client';
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
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
const MessageInterface = ({ conversations: initialConversations, user }: { conversations: ExtendedConversation[], user: {id: string} }) => {
  const [allConversations, setAllConversations] = useState<ExtendedConversation[]>([]);
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
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (!user) return;
    
    if (message.type === 'message') {
      // Get the active conversation
      const activeConvo = allConversations.find(c => c.id === selectedConversationId);
      
      // Check if this is a message from the other participant in the active conversation
      const isFromActiveConvoOtherParticipant = activeConvo && 
        message.senderId === activeConvo.participants.find(p => p.userId !== user.id)?.userId;
      
      // If message is from the other participant in our active conversation, mark as read immediately
      // and send a read receipt
      if (isFromActiveConvoOtherParticipant) {
        message.isRead = true;
        
        // Send read receipt via socket
        if (isConnected && socketRef.current) {
          const readReceiptMessage = {
            conversationId: message.conversationId,
            receiverId: message.senderId,
            senderId: user.id,
            timestamp: new Date(),
            messageIds: [message.id]
          };
          socketRef.current.emit('read_receipt', readReceiptMessage);
        }
      }
      
      setAllConversations((prev) =>
        addMessageToConversation(prev, message.conversationId, {
          ...message,
          isRead: message.senderId === user.id || 
                 (selectedConversationId === message.conversationId && isFromActiveConvoOtherParticipant),
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

  // Socket.io management
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use existing environment variable for Socket.IO server URL
  const socketUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL || 'http://localhost:8080';
  
  // Log environment variables to help with debugging
  useEffect(() => {
    console.log('Socket.IO Environment Variables:');
    console.log('NEXT_PUBLIC_GO_SERVER_URL:', process.env.NEXT_PUBLIC_GO_SERVER_URL || '(not set, using default)');
  }, []);

  const connectSocket = () => {
    if (socketRef.current) {
      console.log('Socket already exists, disconnecting first');
      socketRef.current.disconnect();
    }
    
    if (connectionAttempts >= 3) {
      console.log('Too many connection attempts, stopping');
      return;
    }
    
    try {
      console.log(`Connecting to Socket.IO: ${socketUrl}`);
      const socket = io(socketUrl, {
        query: { 
          userId: user?.id || '',
          client: 'web'
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        forceNew: true,
        autoConnect: true,
        // Fix for "Object: null prototype" issue
        parser: require('socket.io-parser')
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO Connected');
        setIsConnected(true);
        setConnectionAttempts(0);
      });
      
      socket.on('message', (data) => {
        console.log('Received message:', data);
        
        // Check if this is a message response for a message we sent
        // Server should echo back the message with clientId to confirm delivery
        if (data.clientId && data.senderId === user?.id) {
          // This is a response to our sent message, update it to remove pending status
          // and set the delivery status if provided
          setAllConversations((prev) =>
            updateMessageInConversation(prev, data.conversationId, data.clientId, {
              ...data,
              pending: false,
              id: data.id || data.clientId, // Use server ID if available
              deliveryStatus: data.deliveryStatus || 'delivered', // Mark as delivered
              deliveredAt: data.deliveredAt || new Date().toISOString() // Timestamp delivery
            })
          );
          return;
        }
        
        handleWebSocketMessage(data);
      });
      
      socket.on('typing', (data) => {
        console.log('Received typing status:', data);
        handleWebSocketMessage({...data, type: 'typing'});
      });
      
      socket.on('read_receipt', (data) => {
        console.log('Received read receipt:', data);
        handleWebSocketMessage({...data, type: 'read_receipt'});
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO Disconnected:', reason);
        setIsConnected(false);
        setConnectionAttempts(prev => prev + 1);
        
        if (reason === 'io server disconnect') {
          // The server has forcefully disconnected the socket
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, 5000);
        }
        // Socket.IO will automatically try to reconnect for other reasons
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket.IO Connection Error:', error);
        setIsConnected(false);
        
        // Log detailed error for debugging
        console.error('Connection error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // Additional error properties on non-standard errors
          ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
            if (!['name', 'message', 'stack'].includes(key)) {
              try { acc[key] = (error as any)[key]; } catch {}
            }
            return acc;
          }, {} as Record<string, any>)
        });
      });
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      setConnectionAttempts(prev => prev + 1);
    }
  };

  // Initialize conversations and connect to Socket.IO when user data is available
  useEffect(() => {
    if (user) {
      setAllConversations(initialConversations);
      setIsAdmin(user.publicMetadata?.role === 'admin');
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, initialConversations]);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = sidebarVisible ? 'hidden' : 'auto';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isMobile, sidebarVisible]);

  const updateUnreadCounts = (message: any) => {
    if (!user) return;
    
    const conv = allConversations.find((c) => c.id === message.conversationId);
    
    // Only increment unread count if:
    // 1. The message is not from the current user
    // 2. It's not already marked as read
    // 3. It's not from a conversation that's currently selected
    if (conv && message.senderId !== user.id && !message.isRead && selectedConversationId !== message.conversationId) {
      const userRole = conv.participants.find((p) => p.userId === user.id)?.role;
      if (userRole === 'Host') setUnreadHostMessages((prev) => prev + 1);
      else if (userRole === 'Tenant') setUnreadTenantMessages((prev) => prev + 1);
    }
  };

  const handleTypingMessage = (message: any) => {
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
    if (!conv || !isConnected || !socketRef.current) return;
    
    const receiver = conv.participants.find((p) => p.userId !== user.id);
    if (receiver) {
      const message = {
        isTyping,
        conversationId: selectedConversationId,
        receiverId: receiver.userId,
        senderId: user.id,
        senderRole: conv.participants.find((p) => p.userId === user.id)?.role,
        content: '',
        timestamp: Date.now(),
      };
      socketRef.current.emit('typing', message);
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

    // Find unread messages from the other participant
    const unreadMessages = conv.messages.filter(m => 
      m.senderId !== user.id && !m.isRead
    );
    
    if (unreadMessages.length > 0) {
      const timestamp = new Date();
      setAllConversations((prev) => markMessagesAsRead(prev, conversationId, user.id, timestamp));
      
      // Get the other participant for sending read receipt
      const receiver = conv.participants.find((p) => p.userId !== user.id);
      if (isConnected && socketRef.current && receiver) {
        const message = {
          conversationId,
          receiverId: receiver.userId,
          senderId: user.id,
          timestamp: timestamp.toISOString(),
          messageIds: unreadMessages.map(m => m.id)
        };
        socketRef.current.emit('read_receipt', message);
      }
      await markMessagesAsReadByTimestamp(conversationId, timestamp);
    }
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
      id: clientId,
      clientId: clientId, // Ensure clientId is explicitly sent to match up response
      timestamp: new Date(),
      ...(file?.url && { imgUrl: file.url, fileName: file.name, fileKey: file.key, fileType: file.type }),
    };

    const optimisticMessage = createOptimisticMessage(content, file, selectedConversationId, user.id, clientId);
    setAllConversations((prev) => addMessageToConversation(prev, selectedConversationId, optimisticMessage));

    if (isConnected && socketRef.current) {
      socketRef.current.emit('message', messageData);
    } else {
      try {
        const newMessage = await sendMessageViaRest(messageData, createMessage);
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, clientId, {
            ...newMessage,
            pending: false,
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString()
          })
        );
      } catch {
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, clientId, { 
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

  // Early return if user is not available
  if (!user) return null;

  const filteredConversations = filterConversationsByRole(allConversations, user.id, tabs);
  const selectedConversation = allConversations.find((c) => c.id === selectedConversationId) || null;
  const messages = selectedConversation ? [...selectedConversation.messages] : [];
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
        className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-500' : (connectionAttempts >= 3) ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}
      >
        {isConnected ? (
          'Connected'
        ) : (connectionAttempts >= 3) ? (
          <button 
            onClick={() => {
              setConnectionAttempts(0);
              connectSocket();
            }} 
            className="flex items-center"
          >
            <span>Connection failed</span>
            <span className="ml-2 text-xs">(Click to retry)</span>
          </button>
        ) : (
          <button 
            onClick={connectSocket} 
            className="flex items-center"
          >
            <span>Disconnected</span>
            <span className="ml-2 text-xs">({connectionAttempts > 0 ? `Retry ${connectionAttempts}/3` : 'Click to connect'})</span>
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

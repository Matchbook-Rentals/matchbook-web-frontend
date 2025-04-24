'use client';
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
          messages: conv.messages.map((msg) =>
            msg.id && messageIds.includes(msg.id)
              ? { ...msg, updatedAt: timestamp, deliveryStatus: 'read' }
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
const MessageInterface = ({ conversations: initialConversations, user }: { conversations: ExtendedConversation[], user: {id: string} }) => {
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
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (!user) return;
    
    // Handle both regular messages and file messages
    if (message.type === 'message' || message.type === 'file') { 
      // Get the active conversation
      const activeConvo = allConversations.find(c => c.id === selectedConversationId);
      
      // Check if this is a message from the other participant in the active conversation
      const isFromActiveConvoOtherParticipant = activeConvo && 
        message.senderId === activeConvo.participants.find(p => p.userId !== user.id)?.userId;
      
      // If message is from the other participant in our active conversation, mark as read immediately
      // and send a read receipt
      if (isFromActiveConvoOtherParticipant) {
        // Update message status and timestamp directly
        message.deliveryStatus = 'read';
        message.updatedAt = new Date().toISOString();
        
        // Send read receipt via socket
        if (isConnected && socketRef.current) {
          const readReceiptMessage = {
            conversationId: message.conversationId,
            receiverId: message.senderId,
            senderId: user.id,
            timestamp: new Date().toISOString(),
            messageIds: [message.id]
          };
          socketRef.current.emit('read_receipt', readReceiptMessage);
        }
      }
      
      // Add the (potentially modified) message to the conversation state
      setAllConversations((prev) =>
        addMessageToConversation(prev, message.conversationId, message)
      );
      // Update unread counts only if the message wasn't immediately marked as read
      if (!isFromActiveConvoOtherParticipant) {
        updateUnreadCounts(message);
      }
    } else if (message.type === 'typing' && message.senderId !== user.id) {
      handleTypingMessage(message);
    } else if (message.type === 'read_receipt' && message.senderId !== user.id && message.messageIds) {
      // Update the specific messages' updatedAt timestamp based on the receipt
      setAllConversations((prev) => 
        updateMessagesReadTimestamp(prev, message.conversationId, message.messageIds, message.timestamp)
      ); 
    }
  };

  // Socket.io management
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const circuitOpenRef = useRef(false);
  const circuitResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use existing environment variable for Socket.IO server URL
  const socketUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL || 'http://localhost:8080';
  
  // Log environment variables to help with debugging
  useEffect(() => {
    console.log('Socket.IO Environment Variables:');
    console.log('NEXT_PUBLIC_GO_SERVER_URL:', process.env.NEXT_PUBLIC_GO_SERVER_URL || '(not set, using default)');
  }, []);

  // Monitor socket health with heartbeats
  const startHeartbeat = (socket: Socket) => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    
    // Send heartbeat every 30 seconds
    const pingServer = () => {
      if (socket && socket.connected) {
        // Using a custom event that server will echo back
        socket.emit('heartbeat', { timestamp: Date.now() }, (response: any) => {
          if (!response) {
            console.warn('No heartbeat response received');
            checkCircuitBreaker();
          }
        });
        
        // Set up next heartbeat
        heartbeatTimeoutRef.current = setTimeout(pingServer, 30000);
      }
    };
    
    // Start heartbeat cycle
    pingServer();
  };
  
  // Circuit breaker implementation
  const MAX_FAILURES = 3;
  const CIRCUIT_RESET_DELAY = 30000; // 30 seconds
  
  const checkCircuitBreaker = () => {
    failureCountRef.current++;
    if (failureCountRef.current >= MAX_FAILURES) {
      // Open the circuit - stop trying to use socket
      circuitOpenRef.current = true;
      console.warn(`Circuit breaker opened after ${failureCountRef.current} failures`);
      
      // Try to reset after delay
      if (circuitResetTimeoutRef.current) {
        clearTimeout(circuitResetTimeoutRef.current);
      }
      
      circuitResetTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reset circuit breaker');
        circuitOpenRef.current = false;
        failureCountRef.current = 0;
        // Try to reconnect
        connectWithBackoff();
      }, CIRCUIT_RESET_DELAY);
    }
  };
  
  const resetCircuitBreaker = () => {
    failureCountRef.current = 0;
    circuitOpenRef.current = false;
    if (circuitResetTimeoutRef.current) {
      clearTimeout(circuitResetTimeoutRef.current);
      circuitResetTimeoutRef.current = null;
    }
  };

  // Advanced connection retry with exponential backoff and jitter
  const connectWithBackoff = () => {
    if (socketRef.current) {
      console.log('Socket already exists, disconnecting first');
      socketRef.current.disconnect();
    }
    
    const MAX_RETRIES = 5;
    const INITIAL_DELAY = 1000;
    const MAX_DELAY = 30000;
    
    // Add jitter to prevent thundering herd problem
    const getJitteredDelay = (baseDelay: number) => {
      // Add random jitter of ±30%
      const jitterFactor = 0.7 + (Math.random() * 0.6); // 0.7-1.3
      return Math.min(baseDelay * jitterFactor, MAX_DELAY);
    };
    
    const attemptConnection = (retryCount: number, retryDelay: number) => {
      if (retryCount >= MAX_RETRIES) {
        console.log('Maximum connection attempts reached, stopping');
        return;
      }
      
      try {
        console.log(`Connecting to Socket.IO (attempt ${retryCount + 1}): ${socketUrl}`);
        const socket = io(socketUrl, {
          query: { 
            userId: user?.id || '',
            client: 'web'
          },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: retryDelay,
          timeout: 20000,
          transports: ['websocket'], // Prefer WebSocket only
          upgrade: false, // Disable transport upgrade
          forceNew: true,
          autoConnect: true,
        });
        
        // Monitor all socket lifecycle events for debugging
        ['connect', 'connect_error', 'disconnect', 'reconnect', 
         'reconnect_attempt', 'reconnect_error', 'reconnect_failed'].forEach(event => {
          socket.on(event, (...args) => {
            console.log(`Socket.IO ${event} event:`, ...args);
          });
        });
        
        socket.on('connect', () => {
          console.log('Socket.IO Connected');
          setIsConnected(true);
          setConnectionAttempts(0);
          resetCircuitBreaker();
          startHeartbeat(socket);
        });
        
        socket.on('heartbeat', (data) => {
          console.log('Received heartbeat response:', data);
          // Reset failure count on successful heartbeat
          failureCountRef.current = 0;
        });
        
        socket.on('message', (data) => {
          console.log('Received message:', data);
          
          // Check if this is a delivery confirmation for a message we sent
          // Server should echo back the message with the original ID
          if (data.id && data.senderId === user?.id && data.confirmedDeliveryAt) {
            // This is a confirmation for our sent message, update its status
            setAllConversations((prev) =>
              updateMessageInConversation(prev, data.conversationId, data.id, { // Match using data.id
                pending: false,
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
          
          if (reason === 'io server disconnect' || reason === 'transport close') {
            // The server has forcefully disconnected the socket or transport closed
            const nextRetryDelay = getJitteredDelay(
              Math.min(retryDelay * 1.5, MAX_DELAY)
            );
            
            console.log(`Will retry in ${Math.round(nextRetryDelay/1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              attemptConnection(retryCount + 1, nextRetryDelay);
            }, nextRetryDelay);
          }
        });
        
        socket.on('connect_error', (error) => {
          console.error('Socket.IO Connection Error:', error);
          setIsConnected(false);
          checkCircuitBreaker();
          
          // Log detailed connection diagnostics
          console.error('Connection diagnostics:', {
            url: socketUrl,
            transport: socket.io?.engine?.transport?.name,
            protocol: socket.io?.engine?.transport?.protocol,
            readyState: socket.io?.engine?.readyState,
            error: {
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
            }
          });
          
          // Schedule retry with exponential backoff if not handled by socket.io internal reconnection
          if (!socket.io.reconnection) {
            const nextRetryDelay = getJitteredDelay(
              Math.min(retryDelay * 1.5, MAX_DELAY)
            );
            
            console.log(`Will retry in ${Math.round(nextRetryDelay/1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              attemptConnection(retryCount + 1, nextRetryDelay);
            }, nextRetryDelay);
          }
        });
        
        socketRef.current = socket;
      } catch (error) {
        console.error('Failed to create Socket.IO connection:', error);
        
        // Retry with backoff
        const nextRetryDelay = getJitteredDelay(
          Math.min(retryDelay * 1.5, MAX_DELAY)
        );
        
        console.log(`Will retry in ${Math.round(nextRetryDelay/1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptConnection(retryCount + 1, nextRetryDelay);
        }, nextRetryDelay);
      }
    };
    
    // Start connection attempts with initial parameters
    attemptConnection(0, INITIAL_DELAY);
  };
  
  // Legacy connect function maintained for backwards compatibility
  const connectSocket = () => {
    connectWithBackoff();
  };

  // Initialize conversations and connect to Socket.IO when user data is available
  useEffect(() => {
    if (user) {
      setAllConversations(initialConversations);
      setIsAdmin(user.publicMetadata?.role === 'admin');
      connectWithBackoff();
    }

    // Cleanup function to properly clear all resources
    return () => {
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear all timeouts
      [
        reconnectTimeoutRef.current,
        heartbeatTimeoutRef.current,
        circuitResetTimeoutRef.current
      ].forEach(timeout => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
      
      // Reset circuit breaker state
      failureCountRef.current = 0;
      circuitOpenRef.current = false;
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

  const ensureConnected = () => {
    if (!isConnected && !circuitOpenRef.current) {
      console.log('Connection lost, attempting to reconnect due to user action...');
      connectWithBackoff();
      // Return false to indicate connection was not ready immediately
      return false;
    }
    // Return true if already connected or circuit breaker is open (don't retry)
    return isConnected;
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (!user || !selectedConversationId) return;

    // Ensure connection before sending typing status
    if (!ensureConnected()) {
      console.warn('Cannot send typing status: Socket not connected. Reconnection initiated.');
      // Optionally, you could queue this or just skip sending for now
      return;
    }
    
    const conv = allConversations.find((c) => c.id === selectedConversationId);
    // Re-check socketRef.current as ensureConnected might have re-established it asynchronously
    if (!conv || !socketRef.current) return; 
    
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

    // Find unread messages from the other participant based on deliveryStatus
    const unreadMessages = conv.messages.filter(m => 
      m.senderId !== user.id && m.deliveryStatus !== 'read' 
    );
     
    if (unreadMessages.length > 0) {
      const timestamp = new Date().toISOString();
      const messageIdsToMarkRead = unreadMessages.map(m => m.id).filter(id => !!id); // Ensure IDs are valid
       
      // Update client state immediately using the new function
      setAllConversations((prev) => 
        updateMessagesReadTimestamp(prev, conversationId, messageIdsToMarkRead, timestamp)
      );
       
      // Get the other participant for sending read receipt
      const receiver = conv.participants.find((p) => p.userId !== user.id);
      // Ensure connection before sending read receipt
      if (ensureConnected() && socketRef.current && receiver) {
        const message = {
          conversationId,
          receiverId: receiver.userId,
          senderId: user.id,
          timestamp: timestamp,
          messageIds: unreadMessages.map(m => m.id)
        };
        socketRef.current.emit('read_receipt', message);
      }
      await markMessagesAsReadByTimestamp(conversationId, new Date(timestamp));
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
    const messageId = `message_${uuidv4()}`; // Generate prefixed UUID
    const messageData: MessageData = {
      id: messageId, // Use the generated UUID as the primary ID
      content,
      conversationId: selectedConversationId,
      receiverId: receiver.userId,
      senderId: user.id,
      senderRole: conv.participants.find((p) => p.userId === user.id)?.role as 'Host' | 'Tenant',
      // clientId: clientId, // Remove clientId
      timestamp: new Date().toISOString(),
      type: file?.url ? 'file' : 'message', // Explicitly set type based on file presence
      ...(file?.url && { imgUrl: file.url, fileName: file.name, fileKey: file.key, fileType: file.type }),
    };

    const optimisticMessage = createOptimisticMessage(content, file, selectedConversationId, user.id, messageId); // Pass messageId
    setAllConversations((prev) => addMessageToConversation(prev, selectedConversationId, optimisticMessage));

    // Ensure connection before attempting to send via WebSocket
    if (!ensureConnected()) {
       console.warn('Socket not connected when trying to send message. Reconnection initiated. Will attempt REST fallback.');
       // Proceed directly to REST fallback since socket isn't ready
       trySendViaRest();
       return; // Stop here, don't try socket path
    }

    // If ensureConnected returned true, we are connected (or circuit is open, handled below)
    // Check circuit breaker specifically *after* ensuring connection attempt if needed
    if (circuitOpenRef.current) {
      console.log(`Using REST API fallback: Circuit breaker is open.`);
      trySendViaRest();
    } else if (socketRef.current) { // Check socketRef again as ensureConnected might be async
      // Try socket.io with acknowledgment
      try {
        console.log('Sending message via Socket.IO with acknowledgment');
        const SOCKET_TIMEOUT = 5000; // 5 seconds timeout
        
        // Create a promise that resolves on acknowledgment or rejects on timeout
        const sendPromise = new Promise<any>((resolve, reject) => {
          // Set timeout for socket acknowledgment
          const timeoutId = setTimeout(() => {
            reject(new Error('Socket.IO acknowledgment timeout'));
          }, SOCKET_TIMEOUT);
          
          // Send with acknowledgment callback
          socketRef.current!.emit('message', messageData, (ack: any) => {
            clearTimeout(timeoutId);
            if (ack && ack.received) {
              resolve(ack);
            } else {
              reject(new Error('Invalid acknowledgment received'));
            }
          });
        });
        
        // Wait for acknowledgment or timeout
        const ack = await sendPromise;
        console.log('Message successfully delivered via Socket.IO:', ack);
        
        // Update message status on successful acknowledgment from server
        // The server confirmation might include the final DB ID if different, but we use the original messageId
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, messageId, { // Use messageId
            pending: false,
            deliveryStatus: 'delivered', // Marked as delivered by server ack
            deliveredAt: ack.timestamp || new Date().toISOString(),
            // Optionally update with server-confirmed ID if needed, but keep matching by original messageId
            // id: ack.id || messageId
          })
        );
      } catch (error) {
        console.error('Socket.IO message delivery failed:', error);
        checkCircuitBreaker(); // Increment failure count
        trySendViaRest(); // Fall back to REST API
      }
    }
    
    // Helper function to try sending via REST API
    async function trySendViaRest() {
      try {
        console.log('Attempting to send message via REST API');
        // Note: sendMessageViaRest might need adjustment if it relies on clientId
        // Assuming createMessage action handles the provided messageData.id correctly
        const savedMessage = await sendMessageViaRest(messageData, createMessage);
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, messageId, { // Use messageId
            ...savedMessage, // Use the response from the save action
            pending: false,
            deliveryStatus: 'delivered', // Assuming REST success means delivered
            deliveredAt: new Date().toISOString()
          })
        );
        console.log('Message successfully delivered via REST API');
      } catch (error) {
        console.error('REST API message delivery failed:', error);
        setAllConversations((prev) =>
          updateMessageInConversation(prev, selectedConversationId, messageId, { // Use messageId
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

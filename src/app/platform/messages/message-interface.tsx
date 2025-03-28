'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from "@clerk/nextjs";
import { Conversation } from '@prisma/client';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import { getConversation, createMessage, createConversation, deleteConversation, getAllConversations, getRecentConversationsWithMessages } from '@/app/actions/conversations';

// Define the expanded Conversation type that includes the messages and participants
interface ConversationParticipant {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: Date;
  leftAt: Date | null;
  role: string;
  User: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
}

interface ExtendedConversation extends Conversation {
  messages: any[];
  participants: ConversationParticipant[];
}

// Define the message data interface to include file properties
interface MessageData {
  content: string; // Note: The backend now accepts empty strings or null
  senderRole: 'Host' | 'Tenant';
  conversationId: string;
  receiverId: string;
  imgUrl?: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
}

const MessageInterface = ({ conversations }: { conversations: ExtendedConversation[] }) => {
  const { user } = useUser();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [userType, setUserType] = useState<'Host' | 'Tenant'>('Tenant');
  const [allConversations, setAllConversations] = useState<ExtendedConversation[]>(conversations);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [unreadHostMessages, setUnreadHostMessages] = useState(0);
  const [unreadTenantMessages, setUnreadTenantMessages] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTestingTools, setShowTestingTools] = useState(false);
  const [hideTestingSection, setHideTestingSection] = useState(false);
  const [tabs, setTabs] = useState('all');
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL;
  const wsUrl = `${baseUrl?.replace(/^http/, 'ws')}/ws?id=${user?.id}`;

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    if (user?.publicMetadata?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setShowTestingTools(false); // Hide testing tools if not admin
    }
  }, [user]);
  
  // Load initial conversations
  useEffect(() => {
    if (!user) return;
    
    const loadConversations = async () => {
      try {
        console.log('Loading initial conversations...');
        const conversations = await getAllConversations();
        setAllConversations(conversations);
        console.log(`Loaded ${conversations.length} conversations with message history`);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };
    
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      if (selectedConversationIndex !== null) {
        const conversation = allConversations[selectedConversationIndex];
        console.log(`Setting messages for conversation ${conversation.id}`);
        // All conversations now come with messages, so we can just use them directly
        // Reverse the order of messages to display newest last (since we're fetching desc from server)
        setMessages([...(conversation.messages || [])].reverse());
      } else {
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedConversationIndex, allConversations, user]);

  // WebSocket connection setup with more robust reconnection logic
  useEffect(() => {
    if (!user?.id) return;

    const MAX_RECONNECT_ATTEMPTS = 10; // Increased from 5 to 10
    const BASE_RECONNECT_DELAY = 2000; // 2 seconds (reduced from 3)
    const PING_INTERVAL = 20000; // 20 seconds
    
    // Use the pingIntervalRef defined at component level
    
    const connectWebSocket = () => {
      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max WebSocket connection attempts reached');
        setWsMessages(prev => [...prev, { 
          type: 'error', 
          message: `Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Will try again in 30 seconds.`, 
          timestamp: new Date().toISOString() 
        }]);
        
        // Reset retry counter after 30 seconds and try again
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts(0);
          connectWebSocket();
        }, 30000);
        
        return;
      }

      // Clean up any existing connection
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (error) {
          console.warn('Error closing existing WebSocket:', error);
        }
      }
      
      // Clean up any existing ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Log connection attempt
      console.log(`Connecting to WebSocket: ${wsUrl} (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      setWsMessages(prev => [...prev, { 
        type: 'info', 
        message: `Initiating new WebSocket connection to: ${wsUrl} (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`, 
        timestamp: new Date().toISOString() 
      }]);
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        // Set connection timeout - close and retry if it takes too long to connect
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket connection timeout');
            setWsMessages(prev => [...prev, {
              type: 'warning',
              message: 'WebSocket connection attempt timed out',
              timestamp: new Date().toISOString()
            }]);
            
            try {
              ws.close();
            } catch (error) {
              console.warn('Error closing timed out WebSocket:', error);
            }
            
            // Increase connection attempts and try again
            setConnectionAttempts(prev => prev + 1);
            
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            const reconnectDelay = BASE_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts);
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay);
          }
        }, 10000); // 10 second connection timeout

        ws.onopen = () => {
          console.log('WebSocket connection opened');
          clearTimeout(connectionTimeout); // Clear the connection timeout
          setWsConnected(true);
          setConnectionAttempts(0);
          
          setWsMessages(prev => [...prev, { 
            type: 'success', 
            message: 'WebSocket connection opened successfully', 
            timestamp: new Date().toISOString() 
          }]);
          
          // Set up a ping interval to keep the connection alive
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              // Send a small ping message
              try {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
              } catch (error) {
                console.warn('Error sending ping:', error);
              }
            }
          }, PING_INTERVAL);
        };

        ws.onmessage = (event) => {
          // Only log non-ping messages to avoid console spam
          if (!event.data.includes('"type":"ping"')) {
            console.log('WebSocket message received:', event.data);
          }
          
          try {
            const message = JSON.parse(event.data);
            
            // Handle ping responses - don't process further
            if (message.type === 'ping') {
              return;
            }
            
            // Handle connection status messages
            if (message.type === 'connection') {
              setWsMessages(prev => [...prev, { 
                type: 'info', 
                message: `Connection status: ${message.status}`, 
                timestamp: new Date().toISOString() 
              }]);
              return;
            }
            
            // Handle persistence error messages
            if (message.type === 'persistence_error') {
              console.error('Message persistence error:', message);
              setWsMessages(prev => [...prev, { 
                type: 'error', 
                message: `Persistence error for message: ${message.originalMessageId}`, 
                timestamp: new Date().toISOString() 
              }]);
              
              // Show an error toast or notification to the user
              alert('Message delivered but could not be saved. Please try again.');
              return;
            }
            
            // Mark incoming messages as unread by default if they're not from the current user
            if (message.senderId !== user?.id) {
              message.isRead = false;
            } else {
              message.isRead = true; // Messages sent by current user are automatically read
            }
            
            // Add a unique client-side ID if not present to help with deduplication
            if (!message.clientId) {
              message.clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            }
            
            setWsMessages((prevMessages) => [...prevMessages, message]);

            // Update unread message counters based on the message's conversation type
            const messageConversation = allConversations.find(conv => conv.id === message.conversationId);
            if (messageConversation) {
              // Find the user's role in this conversation
              const userParticipant = messageConversation.participants.find(
                participant => participant.userId === user?.id
              );

              if (userParticipant) {
                const messageRole = userParticipant.role;

                // Check if this message's conversation is currently selected/open
                const isConversationOpen = selectedConversationIndex !== null &&
                  allConversations[selectedConversationIndex]?.id === message.conversationId;

                // Increment unread counter if the conversation is not open
                if (!isConversationOpen) {
                  if (messageRole === 'Host') {
                    setUnreadHostMessages(prev => prev + 1);
                  } else if (messageRole === 'Tenant') {
                    setUnreadTenantMessages(prev => prev + 1);
                  }
                }
              }
            }

            // Check if this message is from a conversation we already know about
            const conversationExists = allConversations.some(conv => conv.id === message.conversationId);

            if (!conversationExists) {
              console.log('New conversation detected. Fetching updated conversations...');
              // Fetch all conversations to get the new one
              const fetchNewConversations = async () => {
                try {
                  const updatedConversations = await getAllConversations();
                  if (updatedConversations) {
                    setAllConversations(updatedConversations);

                    // Find the index of the new conversation to select it
                    const newConvIndex = updatedConversations.findIndex(
                      conv => conv.id === message.conversationId
                    );

                    if (newConvIndex !== -1) {
                      setSelectedConversationIndex(newConvIndex);
                    }
                  }
                } catch (error) {
                  console.error('Failed to fetch new conversations:', error);
                }
              };

              fetchNewConversations();
            } else {
              // Check for duplicate messages to avoid adding the same message twice
              // This can happen if a message is delivered via WebSocket and then also appears in the conversation fetch
              setAllConversations((prevConversations) => {
                const updatedConversations = [...prevConversations];
                const index = updatedConversations.findIndex(conv => conv.id === message.conversationId);
                
                if (index !== -1) {
                  // Create a new array if messages property doesn't exist yet
                  const currentMessages = updatedConversations[index].messages || [];
                  
                  // Check if this message already exists in the conversation
                  // Using ID for server-generated messages or clientId for client-generated ones
                  const messageAlreadyExists = currentMessages.some(existingMsg => 
                    (message.id && existingMsg.id === message.id) || 
                    (message.clientId && existingMsg.clientId === message.clientId)
                  );
                  
                  if (!messageAlreadyExists) {
                    // Check if this conversation is currently selected/open
                    const isConversationOpen = selectedConversationIndex !== null && 
                      updatedConversations[selectedConversationIndex]?.id === message.conversationId;
                    
                    // If the conversation is open and the message is from another user, mark it as read
                    if (isConversationOpen && message.senderId !== user?.id) {
                      message.isRead = true;
                    }
                    
                    updatedConversations[index] = {
                      ...updatedConversations[index],
                      // Add new message to the beginning of the array since we're retrieving in desc order
                      messages: [message, ...currentMessages]
                    };
                    
                    return updatedConversations;
                  }
                }
                
                // No changes needed - either conversation not found or message already exists
                return prevConversations;
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(connectionTimeout); // Clear the connection timeout
          setWsConnected(false);
          
          setWsMessages(prev => [...prev, {
            type: 'error',
            message: 'WebSocket connection error encountered',
            timestamp: new Date().toISOString()
          }]);
          
          // Clean up ping interval if it exists
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        };

        ws.onclose = (event) => {
          console.log(`WebSocket closed with code ${event.code}:`, event.reason);
          clearTimeout(connectionTimeout); // Clear the connection timeout
          setWsConnected(false);
          
          // Clean up ping interval if it exists
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          
          setWsMessages(prev => [...prev, {
            type: 'info',
            message: `WebSocket connection closed: ${event.reason || 'No reason provided'} (code: ${event.code})`,
            timestamp: new Date().toISOString()
          }]);

          // Determine if this was a clean close or not
          const wasCleanClose = event.wasClean || event.code === 1000;
          
          // For clean closes, don't immediately reconnect unless requested
          if (wasCleanClose && connectionAttempts === 0) {
            console.log('Clean WebSocket close, not immediately reconnecting');
            return;
          }

          // Attempt to reconnect with exponential backoff
          const reconnectDelay = BASE_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts);
          setConnectionAttempts(prev => prev + 1);
          
          console.log(`Reconnecting in ${reconnectDelay}ms (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          setWsMessages(prev => [...prev, {
            type: 'info',
            message: `Reconnecting in ${reconnectDelay}ms (attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
            timestamp: new Date().toISOString()
          }]);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setWsMessages(prev => [...prev, {
          type: 'error',
          message: `Failed to create WebSocket: ${error}`,
          timestamp: new Date().toISOString()
        }]);
        
        // Retry after delay
        const reconnectDelay = BASE_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts);
        setConnectionAttempts(prev => prev + 1);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, reconnectDelay);
      }
    };

    connectWebSocket();

    return () => {
      console.log('Cleaning up WebSocket connection');
      // Clean up all intervals and timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Close the WebSocket connection
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (error) {
          console.warn('Error closing WebSocket in cleanup:', error);
        }
        wsRef.current = null;
      }
    };
  }, [user, wsUrl, connectionAttempts]);

  // Detect mobile screen size
  useEffect(() => {
    if (!user) return;

    const checkIfMobile = () => {
      // MD breakpoint in Tailwind is 768px
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add resize listener
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [user, allConversations, selectedConversationIndex]);

  useEffect(() => {
    if (!user || !isMobile) return;

    // On mobile, always show conversation list on initial load
    setSidebarVisible(true);
  }, [isMobile, user]);

  const handleSelectConversation = async (index: number) => {
    setSelectedConversationIndex(index);

    // Clear relevant unread message counter when selecting a conversation
    const conversation = allConversations[index];
    const userParticipant = conversation.participants.find(
      participant => participant.userId === user?.id
    );

    if (userParticipant && userParticipant.role === 'Host') {
      setUnreadHostMessages(0);
    } else if (userParticipant && userParticipant.role === 'Tenant') {
      setUnreadTenantMessages(0);
    }

    // Mark all messages in this conversation as read
    // This is a local state update only - in a real app, you would call an API to update the read status
    setAllConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      const conversationToUpdate = updatedConversations[index];
      
      if (conversationToUpdate && conversationToUpdate.messages) {
        // Mark all messages from other participants as read
        conversationToUpdate.messages = conversationToUpdate.messages.map(message => {
          if (message.senderId !== user?.id) {
            return { ...message, isRead: true };
          }
          return message;
        });
      }
      
      return updatedConversations;
    });

    // On mobile, hide the sidebar immediately after selection
    if (isMobile) {
      // Set messages directly from the conversation
      setMessages(conversation.messages || []);
      
      // Hide the sidebar to show the message area
      setSidebarVisible(false);
    }
  };

  const handleDeleteAllConversations = async () => {
    if (window.confirm('Are you sure you want to delete all your conversations? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        // Delete each conversation one by one
        for (const conversation of allConversations) {
          await deleteConversation(conversation.id);
        }
        // Clear the local state
        setAllConversations([]);
        setSelectedConversationIndex(null);
        setMessages([]);
      } catch (error) {
        console.error('Failed to delete conversations:', error);
        alert('An error occurred while deleting conversations');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSendMessage = async (
    newMessageInput: string,
    fileUrl?: string,
    fileName?: string,
    fileKey?: string,
    fileType?: string
  ) => {
    console.log('=== HANDLE SEND MESSAGE ===');
    console.log('Input params:', { newMessageInput, fileUrl, fileName, fileKey, fileType });
    
    // Remove the trim check to allow empty string messages with attachments
    if (selectedConversationIndex === null) {
      console.error('No conversation selected');
      return;
    }

    const selectedConversation = allConversations[selectedConversationIndex];
    console.log('Selected conversation:', selectedConversation.id);

    // Find the other participant who isn't the current user
    const otherParticipant = selectedConversation.participants.find(
      participant => participant.User.id !== user?.id
    );

    if (!otherParticipant) {
      console.error('Cannot find recipient for message');
      return;
    }
    console.log('Recipient found:', otherParticipant.User.id);

    // Generate a client-side ID for this message to help with tracking and deduplication
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const messageData: MessageData & { clientId?: string } = {
      content: newMessageInput, // This can be empty string now
      senderRole: userType,
      conversationId: selectedConversation.id,
      receiverId: otherParticipant.User.id,
      senderId: user?.id,
      clientId: clientId // Add unique client ID to help with tracking
    };

    // Add file information if available
    if (fileUrl) {
      console.log('Adding file information to message');
      messageData.imgUrl = fileUrl; // Keep for backward compatibility
      messageData.fileName = fileName;
      messageData.fileKey = fileKey;
      messageData.fileType = fileType;
    }

    console.log('Message data to send:', messageData);
    
    // Create optimistic message object for immediate UI feedback
    const optimisticMessage = {
      ...messageData,
      id: `temp-${clientId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isRead: true, // Messages sent by current user are automatically read
      pending: true // Mark as pending until confirmed
    };
    
    // Optimistically add to UI at the end (since messages are now displayed oldest to newest)
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    
    // Add to conversation
    setAllConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      const index = updatedConversations.findIndex(conv => conv.id === selectedConversation.id);
      
      if (index !== -1) {
        const currentMessages = updatedConversations[index].messages || [];
        updatedConversations[index] = {
          ...updatedConversations[index],
          // Add to beginning of array for proper ordering when we reverse in the UI
          messages: [optimisticMessage, ...currentMessages]
        };
      }
      
      return updatedConversations;
    });
    
    let messageSent = false;
    let sendAttempts = 0;
    const maxSendAttempts = 3;
    
    // Try WebSocket first with retry logic
    if (wsRef.current && wsConnected) {
      while (!messageSent && sendAttempts < maxSendAttempts) {
        try {
          sendAttempts++;
          // Send message directly through WebSocket for instant delivery
          wsRef.current.send(JSON.stringify(messageData));
          console.log(`Message sent via WebSocket (attempt ${sendAttempts})`);
          messageSent = true;
          break;
        } catch (error) {
          console.error(`Error sending message via WebSocket (attempt ${sendAttempts}/${maxSendAttempts}):`, error);
          
          if (sendAttempts < maxSendAttempts) {
            // Short delay before retry
            await new Promise(resolve => setTimeout(resolve, 500 * sendAttempts));
          }
        }
      }
    }
    
    // If WebSocket fails or is not connected, use REST API as fallback
    if (!messageSent) {
      console.warn('WebSocket messaging failed or not available, using REST API instead');
      try {
        const newMessage = await createMessage(messageData);
        console.log('Message created successfully via REST API:', newMessage);
        
        // Update the optimistic message with the server-generated ID and remove pending status
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            (msg.clientId === clientId) ? { ...newMessage, isRead: true } : msg
          )
        );
        
        // Update in conversation too
        setAllConversations(prevConversations => {
          const updatedConversations = [...prevConversations];
          const index = updatedConversations.findIndex(conv => conv.id === selectedConversation.id);
          
          if (index !== -1) {
            updatedConversations[index] = {
              ...updatedConversations[index],
              messages: updatedConversations[index].messages?.map(msg => 
                (msg.clientId === clientId) ? { ...newMessage, isRead: true } : msg
              ) || []
            };
          }
          
          return updatedConversations;
        });
        
        messageSent = true;
      } catch (error) {
        console.error('Error creating message via REST API:', error);
        
        // Mark the message as failed
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            (msg.clientId === clientId) 
              ? { ...msg, pending: false, failed: true, error: 'Failed to send message' } 
              : msg
          )
        );
        
        // Update in conversation too
        setAllConversations(prevConversations => {
          const updatedConversations = [...prevConversations];
          const index = updatedConversations.findIndex(conv => conv.id === selectedConversation.id);
          
          if (index !== -1) {
            updatedConversations[index] = {
              ...updatedConversations[index],
              messages: updatedConversations[index].messages?.map(msg => 
                (msg.clientId === clientId) 
                  ? { ...msg, pending: false, failed: true, error: 'Failed to send message' } 
                  : msg
              ) || []
            };
          }
          
          return updatedConversations;
        });
        
        // Show error to user
        alert('Failed to send message. Please try again.');
      }
    }
    
    // If we're here and messageSent is still false, both WebSocket and REST API failed
    if (!messageSent) {
      console.error('All message sending methods failed');
    }
  };

  const handleCreateConversation = async (email: string) => {
    if (!email.trim()) return;
    try {
      // Call createConversation with specified roles
      const response = await createConversation(email, 'Host', 'Tenant');

      // Add the new conversation to our state, ensuring it has the expected properties
      const newConversation: ExtendedConversation = {
        ...response,
        messages: [], // Initialize with empty messages array
        // The API response might need to be shaped to match our expected format:
        participants: response.participants.map((p: any) => ({
          ...p,
          User: p.User || {
            id: p.userId,
            firstName: null,
            lastName: null,
            email: null,
            imageUrl: null
          }
        }))
      };

      setAllConversations([...allConversations, newConversation]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setTabs(value);
    
    if (value === 'Host' || value === 'Tenant') {
      setUserType(value as 'Host' | 'Tenant');

      // Clear unread messages count for the tab we're switching to
      if (value === 'Host') {
        setUnreadHostMessages(0);
      } else if (value === 'Tenant') {
        setUnreadTenantMessages(0);
      }
    }
  };

  const toggleSidebar = () => {
    // Toggle sidebar state
    setSidebarVisible(prev => !prev);
    
    // For mobile, when showing the conversation list again, we might want to keep the selected conversation
    // but still allow users to choose a different conversation
  };

  // This effect manages the behavior when toggling back to the conversation list
  useEffect(() => {
    if (!user) return;

    // When we toggle sidebar visibility, ensure we don't have a half-rendered state
    if (isMobile) {
      // Apply transition class to prevent UI getting stuck
      document.body.style.overflow = sidebarVisible ? 'hidden' : 'auto';
    }
    
    return () => {
      // Cleanup to prevent any lingering style issues
      document.body.style.overflow = 'auto';
    };
  }, [sidebarVisible, isMobile, user]);

  // Add conditional return after all hooks are defined
  if (!user) return null;

  // Filter conversations based on the selected tab/role
  const filteredConversations = tabs === 'all' 
    ? allConversations 
    : allConversations.filter(conv => {
        const userParticipant = conv.participants.find(
          participant => participant.userId === user?.id
        );
        return userParticipant && userParticipant.role === tabs;
      });

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] sm:min-h-[calc(100vh-65px)] md:min-h-[calc(100vh-80px)] bg-background">

      <div className="flex flex-1 overflow-hidden relative bg-background">
        {/* Conversation List / Sidebar */}
        <div
          className={`md:block  h-[calc(100vh-65px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-80px)] z-10 bg-background
            ${isMobile ? 'absolute inset-0 transform transition-transform duration-300 ease-in-out' : 'static'}
            ${isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}`}
        >
          <ConversationList
            conversations={filteredConversations}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            user={user as any}
            onTabChange={handleTabChange}
            activeTab={tabs}
            selectedConversationIndex={selectedConversationIndex !== null ? selectedConversationIndex : undefined}
          />
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 bg-background 
            ${isMobile ? 'absolute inset-0 transform transition-transform duration-300 ease-in-out' : 'static'}
            ${isMobile && sidebarVisible ? 'translate-x-full' : 'translate-x-0'}`}
        >
          <MessageArea
            selectedConversation={selectedConversationIndex !== null ? allConversations[selectedConversationIndex] : null}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={user?.id}
            currentUserImage={user?.imageUrl}
            onBack={toggleSidebar}
          />
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm ${wsConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
        {wsConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Admin Testing Tools Section - Only visible if not completely hidden */}
      {isAdmin && !hideTestingSection && (
        <>
          {/* Admin Testing Tools Toggle */}
          <div className="mt-4 px-4 border-t border-gray-200 py-2 flex justify-between">
            <button
              className={`px-4 py-2 rounded-md ${showTestingTools ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              onClick={() => setShowTestingTools(!showTestingTools)}
            >
              {showTestingTools ? 'Hide Testing Tools' : 'Show Testing Tools'}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setHideTestingSection(true)}
            >
              Hide Until Refresh
            </button>
          </div>

          {/* Testing Tools */}
          {showTestingTools && (
            <div className="mt-2 p-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Testing Tools</h3>
              <div className="flex items-center mb-3">
                <input
                  type="email"
                  className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email to start conversation"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-blue-500 rounded-r-md hover:bg-blue-600 text-white"
                  onClick={() => {
                    if (testEmail.trim()) {
                      handleCreateConversation(testEmail);
                      setTestEmail('');
                    }
                  }}
                >
                  Start Test Conversation
                </button>
              </div>
              <div className="flex justify-between mb-3">
                <button
                  className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300 text-white"
                  onClick={handleDeleteAllConversations}
                  disabled={isDeleting || allConversations.length === 0}
                >
                  {isDeleting ? 'Deleting...' : 'Delete All Conversations'}
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-600 text-white"
                  onClick={() => setWsMessages([])}
                >
                  Clear WS Log
                </button>
              </div>

              {/* WebSocket Connection Details */}
              <div className="flex items-center mb-3 space-x-2">
                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
                {!wsConnected && connectionAttempts > 0 && (
                  <span className="text-xs text-gray-500">
                    (Attempt {connectionAttempts}/{5})
                  </span>
                )}
                <button
                  className="ml-auto px-3 py-1 bg-blue-500 rounded-md hover:bg-blue-600 text-white text-sm"
                  onClick={() => {
                    setConnectionAttempts(0);
                    if (wsRef.current) {
                      wsRef.current.close();
                    }
                  }}
                  disabled={connectionAttempts === 0 && wsConnected}
                >
                  Reconnect
                </button>
              </div>

              {/* WebSocket Log Section */}
              <div className="mt-6 bg-gray-900 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-2 text-white">WebSocket Connection Log</h4>
                <div className="bg-gray-800 rounded p-3 overflow-auto max-h-80 text-sm text-white">
                  {wsMessages.length > 0 ? (
                    <div className="space-y-2">
                      {wsMessages.map((msg, index) => (
                        <div key={index} className={`p-2 rounded ${
                          msg.type === 'error' ? 'bg-red-900 text-red-100' :
                          msg.type === 'success' ? 'bg-green-900 text-green-100' :
                          msg.type === 'info' ? 'bg-blue-900 text-blue-100' :
                          'bg-gray-700 '
                        }`}>
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {msg.type === 'error' ? '❌ Error' :
                              msg.type === 'success' ? '✅ Success' :
                              msg.type === 'info' ? 'ℹ️ Info' : 'Message'}
                            </span>
                            {msg.timestamp && (
                              <span className="text-xs opacity-80">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs font-mono">
                            {msg.message || JSON.stringify(msg, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic p-2">No WebSocket events logged yet</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MessageInterface;
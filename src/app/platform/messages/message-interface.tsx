'use client'
import React, { useState, useEffect } from 'react';
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

  const [userType, setUserType] = useState<'Host' | 'Tenant'>('Tenant');
  const [allConversations, setAllConversations] = useState<ExtendedConversation[]>(conversations);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sseMessages, setSseMessages] = useState<any[]>([]);
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
  const [lazyLoadedConversations, setLazyLoadedConversations] = useState<Record<string, boolean>>({});

  const baseUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL
  const url = `${baseUrl}/events?id=${user?.id}`

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
  
  // Lazy load the top 15 recent conversations with full message history
  useEffect(() => {
    if (!user) return;
    
    const loadRecentConversations = async () => {
      try {
        console.log('Loading recent conversations with full message history...');
        const recentConversations = await getRecentConversationsWithMessages(15);
        
        // Create a record of fully loaded conversations
        const loadedConvos: Record<string, boolean> = {};
        
        // Update allConversations with the fully loaded conversations
        setAllConversations(prevConversations => {
          // Create a new conversations array with the same order
          const updatedConversations = [...prevConversations];
          
          // For each of the recent fully loaded conversations
          recentConversations.forEach(fullConversation => {
            // Find its index in our current conversations array
            const index = updatedConversations.findIndex(c => c.id === fullConversation.id);
            
            if (index !== -1) {
              // Replace with the fully loaded version
              updatedConversations[index] = fullConversation as any;
            }
            
            // Mark this conversation as fully loaded
            loadedConvos[fullConversation.id] = true;
          });
          
          return updatedConversations;
        });
        
        // Update our record of which conversations are fully loaded
        setLazyLoadedConversations(loadedConvos);
        console.log(`Lazy loaded ${recentConversations.length} conversations with full message history`);
      } catch (error) {
        console.error('Error lazy loading recent conversations:', error);
      }
    };
    
    loadRecentConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      if (selectedConversationIndex !== null) {
        const conversation = allConversations[selectedConversationIndex];
        
        // Check if this conversation has already been lazy loaded
        if (lazyLoadedConversations[conversation.id]) {
          console.log(`Using cached messages for conversation ${conversation.id}`);
          // Use the already loaded messages
          setMessages(conversation.messages || []);
        } else {
          // Fetch the full conversation if it hasn't been lazy loaded
          console.log(`Fetching messages for conversation ${conversation.id}`);
          const fullConversation = await getConversation(conversation.id);
          if (fullConversation) {
            setMessages(fullConversation.messages || []);
            
            // Update the lazyLoadedConversations record
            setLazyLoadedConversations(prev => ({
              ...prev,
              [conversation.id]: true
            }));
            
            // Also update the conversation in allConversations
            setAllConversations(prevConversations => {
              const updatedConversations = [...prevConversations];
              updatedConversations[selectedConversationIndex] = {
                ...updatedConversations[selectedConversationIndex],
                messages: fullConversation.messages || []
              };
              return updatedConversations;
            });
          }
        }
      } else {
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedConversationIndex, allConversations, user, isMobile, lazyLoadedConversations]);

  useEffect(() => {
    if (!user?.id) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds

    const connectSSE = () => {
      if (retryCount >= maxRetries) {
        console.error('Max SSE connection retries reached');
        setTimeout(() => {
          retryCount = 0;
          connectSSE();
        }, 30000); // 30 seconds
        return;
      }

      // Close existing connection if any
      if (eventSource) {
        eventSource.close();
      }

      console.log(`Connecting to SSE: ${url}`);
      console.log('Initiating new SSE connection...');
      setSseMessages(prev => [...prev, { type: 'info', message: `Initiating new SSE connection to: ${url}`, timestamp: new Date().toISOString() }]);
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setSseMessages(prev => [...prev, { type: 'success', message: 'SSE connection opened successfully', timestamp: new Date().toISOString() }]);
        retryCount = 0; // Reset retry count on successful connection
      };

      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event);
        if (event.data.trim() === ': keepalive') {
          // Ignore heartbeat messages
          console.log('Keepalive received');
          return;
        }

        try {
          const message = JSON.parse(event.data);
          
          // Mark incoming messages as unread by default if they're not from the current user
          if (message.senderId !== user?.id) {
            message.isRead = false;
          } else {
            message.isRead = true; // Messages sent by current user are automatically read
          }
          
          setSseMessages((prevMessages) => [...prevMessages, message]);

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
            // Update existing conversation with the new message
            setAllConversations((prevConversations) => {
              const updatedConversations = [...prevConversations];
              const index = updatedConversations.findIndex(conv => conv.id === message.conversationId);
              if (index !== -1) {
                // Create a new array if messages property doesn't exist yet
                const currentMessages = updatedConversations[index].messages || [];
                
                // Check if this conversation is currently selected/open
                const isConversationOpen = selectedConversationIndex !== null && 
                  updatedConversations[selectedConversationIndex]?.id === message.conversationId;
                
                // If the conversation is open and the message is from another user, mark it as read
                if (isConversationOpen && message.senderId !== user?.id) {
                  message.isRead = true;
                }
                
                updatedConversations[index] = {
                  ...updatedConversations[index],
                  messages: [...currentMessages, message]
                };
              }
              return updatedConversations;
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setSseMessages(prev => [...prev, {
          type: 'error',
          message: `SSE connection error encountered`,
          timestamp: new Date().toISOString()
        }]);

        // Close the current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Attempt to reconnect after delay
        retryCount++;
        console.log(`Retrying SSE connection (${retryCount}/${maxRetries}) in ${retryDelay}ms`);
        setSseMessages(prev => [...prev, {
          type: 'info',
          message: `Retrying SSE connection (attempt ${retryCount}/${maxRetries}) in ${retryDelay}ms`,
          timestamp: new Date().toISOString()
        }]);
        setTimeout(connectSSE, retryDelay);
      };
    };

    connectSSE();

    return () => {
      console.log('Closing SSE connection');
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [user, url]);

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

    // On mobile, use lazy loaded data if available or fetch if needed
    if (isMobile) {
      try {
        // Check if this conversation has already been lazy loaded
        if (lazyLoadedConversations[conversation.id]) {
          console.log(`Using cached messages for mobile conversation ${conversation.id}`);
          // Use the already loaded messages
          setMessages(conversation.messages || []);
        } else {
          console.log(`Fetching messages for mobile conversation ${conversation.id}`);
          // Fetch the full conversation if it hasn't been lazy loaded
          const fullConversation = await getConversation(conversation.id);
          if (fullConversation) {
            setMessages(fullConversation.messages || []);
            
            // Update the lazyLoadedConversations record
            setLazyLoadedConversations(prev => ({
              ...prev,
              [conversation.id]: true
            }));
            
            // Also update the conversation in allConversations
            setAllConversations(prevConversations => {
              const updatedConversations = [...prevConversations];
              const convIndex = updatedConversations.findIndex(c => c.id === conversation.id);
              if (convIndex !== -1) {
                updatedConversations[convIndex] = {
                  ...updatedConversations[convIndex],
                  messages: fullConversation.messages || []
                };
              }
              return updatedConversations;
            });
          }
        }
        
        // After data is loaded, then hide the sidebar to show the message area
        setSidebarVisible(false);
      } catch (error) {
        console.error('Error loading conversation:', error);
        // Still transition even if there's an error
        setSidebarVisible(false);
      }
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

    const messageData: MessageData = {
      content: newMessageInput, // This can be empty string now
      senderRole: userType,
      conversationId: selectedConversation.id,
      receiverId: otherParticipant.User.id
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
    try {
      const newMessage = await createMessage(messageData);
      console.log('Message created successfully:', newMessage);
      setMessages([...messages, newMessage]);
    } catch (error) {
      console.error('Error creating message:', error);
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
          className={`md:block w-full md:w-1/4 lg:w-1/3 h-[calc(100vh-65px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-80px)] z-10 bg-background
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
                  onClick={() => setSseMessages([])}
                >
                  Clear SSE Log
                </button>
              </div>

              {/* SSE Log Section */}
              <div className="mt-6 bg-gray-900 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-2 text-white">SSE Connection Log</h4>
                <div className="bg-gray-800 rounded p-3 overflow-auto max-h-80 text-sm text-white">
                  {sseMessages.length > 0 ? (
                    <div className="space-y-2">
                      {sseMessages.map((msg, index) => (
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
                    <div className="text-gray-400 italic p-2">No SSE events logged yet</div>
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

'use client'
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { Conversation } from '@prisma/client';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import { getConversation, createMessage, createConversation, deleteConversation, getAllConversations } from '@/app/actions/conversations';

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
  content: string;
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
  const [tabs, setTabs] = useState('all');
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      if (selectedConversationIndex !== null) {
        const conversation = allConversations[selectedConversationIndex];
        const fullConversation = await getConversation(conversation.id);
        if (fullConversation) {
          setMessages(fullConversation.messages || []);
        }
      } else {
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedConversationIndex, allConversations, user]);

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

    // If initial load on mobile, hide sidebar
    setSidebarVisible(false);
  }, [isMobile, user]);

  const handleSelectConversation = (index: number) => {
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

    // On mobile, hide the sidebar when a conversation is selected
    if (isMobile) {
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
    if (selectedConversationIndex === null || !newMessageInput.trim()) return;

    const selectedConversation = allConversations[selectedConversationIndex];

    // Find the other participant who isn't the current user
    const otherParticipant = selectedConversation.participants.find(
      participant => participant.User.id !== user?.id
    );

    if (!otherParticipant) {
      console.error('Cannot find recipient for message');
      return;
    }

    const messageData: MessageData = {
      content: newMessageInput,
      senderRole: userType,
      conversationId: selectedConversation.id,
      receiverId: otherParticipant.User.id
    };

    // Add file information if available
    if (fileUrl) {
      messageData.imgUrl = fileUrl; // Keep for backward compatibility
      messageData.fileName = fileName;
      messageData.fileKey = fileKey;
      messageData.fileType = fileType;
    }

    const newMessage = await createMessage(messageData);

    setMessages([...messages, newMessage]);
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
    if (value === 'Host' || value === 'Tenant') {
      setUserType(value as 'Host' | 'Tenant');

      // Clear unread messages count for the tab we're switching to
      if (value === 'Host') {
        setUnreadHostMessages(0);
      } else {
        setUnreadTenantMessages(0);
      }
    }
  };

  const toggleSidebar = () => {
    // Toggle sidebar state
    setSidebarVisible(prev => !prev);
  };

  // Add an effect to reset MessageArea when sidebar is toggled
  useEffect(() => {
    if (!user) return;

    if (isMobile && selectedConversationIndex !== null && sidebarVisible) {
      // If the sidebar is shown and we have a selected conversation,
      // let's wait for the animation to complete before resetting
      setTimeout(() => {
        // Don't reset if the user has hidden sidebar again
        if (sidebarVisible) {
          setSelectedConversationIndex(null);
        }
      }, 300); // Match the animation duration
    }
  }, [sidebarVisible, isMobile, selectedConversationIndex, user]);

  // Add conditional return after all hooks are defined
  if (!user) return null;

  // Use all conversations instead of filtering by role
  const filteredConversations = allConversations;

  return (
    <div className="flex flex-col min-h-[85vh] bg-background">
      {/* Header */}
      <div className="w-full bg-background md:hidden text-black p-0 flex justify-between items-center shadow-md">
        <button className="md:hidden p-3" onClick={toggleSidebar}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Conversation List / Sidebar */}
        <div
          className={`md:block md:w-1/4 lg:w-1/3 h-full z-10 bg-background
            ${isMobile ? 'fixed inset-0 pt-1 transform transition-transform duration-300 ease-in-out' : 'static'}
            ${isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}`}
        >
          <ConversationList
            conversations={filteredConversations}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            user={user as any}
          />
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 bg-background
            ${isMobile ? 'fixed inset-0 transform transition-transform duration-300 ease-in-out' : 'static'}
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

      {/* Admin Testing Tools Toggle */}
      {isAdmin && (
        <div className="mt-4 px-4 border-t border-gray-200 py-2">
          <button
            className={`px-4 py-2 rounded-md ${showTestingTools ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={() => setShowTestingTools(!showTestingTools)}
          >
            {showTestingTools ? 'Hide Testing Tools' : 'Show Testing Tools'}
          </button>
        </div>
      )}

      {/* Testing Tools */}
      {isAdmin && showTestingTools && (
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
    </div>
  );
};

export default MessageInterface;

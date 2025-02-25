'use client'
//IMports
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { Conversation } from '@prisma/client';
import UserTypeSelector from './components/UserTypeSelector';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import { getConversation, createMessage, createConversation } from '@/app/actions/conversations';

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

// Define the message data interface to include imgUrl
interface MessageData {
  content: string;
  senderRole: 'Landlord' | 'Tenant'; // Used for UI context, not stored in database
  conversationId: string;
  receiverId: string;
  imgUrl?: string;
}

const MessageInterface = ({ conversations }: { conversations: ExtendedConversation[] }) => {
  const { user } = useUser();
  const [userType, setUserType] = useState<'Landlord' | 'Tenant'>('Landlord');
  const [allConversations, setAllConversations] = useState<ExtendedConversation[]>(conversations);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sseMessages, setSseMessages] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL
  const url = `${baseUrl}/events?id=${user?.id}`

  useEffect(() => {
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
  }, [selectedConversationIndex, allConversations]);

  useEffect(() => {
    if (!user?.id) return;

    //const eventSource = new EventSource(`/api/sse?id=${user.id}`);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      console.log(event)
      if (event.data.trim() === ': keepalive') {
        // Ignore heartbeat messages
        return;
      }

      const message = JSON.parse(event.data);
      setSseMessages((prevMessages) => [...prevMessages, message]);
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
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const handleSelectConversation = (index: number) => {
    setSelectedConversationIndex(index);
  };

  const handleSendMessage = async (newMessageInput: string, imgUrl?: string) => {
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

    if (imgUrl) {
      messageData.imgUrl = imgUrl;
    }

    const newMessage = await createMessage(messageData);

    setMessages([...messages, newMessage]);
  };

  const handleCreateConversation = async (email: string) => {
    if (!email.trim()) return;
    try {
      // Call createConversation and process the response to match our expected interface
      const response = await createConversation(email);

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
      // TODO: Handle error (e.g., show an error message to the user)
    }
  };

  if (!user) return null;
  return (
    <div className="flex flex-col">
      {url}
      <UserTypeSelector userType={userType} setUserType={setUserType} />
      <div onClick={() => console.log(conversations)} >{sseMessages.length}</div>
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={allConversations}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          user={user as any} // Cast to any to bypass the Clerk UserResource type issue
        />
        <MessageArea
          selectedConversation={selectedConversationIndex !== null ? allConversations[selectedConversationIndex].id : null}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id}
        />
      </div>

      {/* Testing Tools */}
      <div className="mt-4 p-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Testing Tools</h3>
        <div className="flex items-center">
          <input
            type="email"
            className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email to start conversation"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
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
      </div>
    </div>
  );
};

export default MessageInterface;

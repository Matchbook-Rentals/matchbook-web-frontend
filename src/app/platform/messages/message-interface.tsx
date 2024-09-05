'use client'
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { Conversation } from '@prisma/client';
import UserTypeSelector from './components/UserTypeSelector';
import ConversationList from './components/ConversationList';
import MessageArea from './components/MessageArea';
import { getConversation, createMessage, createConversation } from '@/app/actions/conversations';

const MessageInterface = ({ conversations }: { conversations: Conversation[] }) => {
  const { user } = useUser();
  const [userType, setUserType] = useState<'Landlord' | 'Tenant'>('Landlord');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sseMessages, setSseMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (selectedConversationId) {
        const conversation = await getConversation(selectedConversationId);
        setSelectedConversation(conversation);
        setMessages(conversation?.messages || []);
      } else {
        setSelectedConversation(null);
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedConversationId]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse?id=${user?.id}`);

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setSseMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      eventSource.close();
    };
  }, []);



  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSendMessage = async (newMessageInput: string) => {
    if (!selectedConversationId || !newMessageInput.trim()) return;

    let receiverId: string;
    if (user?.id === selectedConversation?.participant1Id) {
      receiverId = selectedConversation?.participant2Id;
    } else {
      receiverId = selectedConversation?.participant1Id;
    }

    const newMessage = await createMessage({
      content: newMessageInput,
      senderRole: userType,
      conversationId: selectedConversationId,
      receiverId: receiverId
    });

    setMessages([...messages, newMessage]);
  };

  const handleCreateConversation = async (email: string) => {
    if (!email.trim()) return;
    try {
      await createConversation(email);
      // TODO: Update the conversations list or refetch conversations
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // TODO: Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col">
      <UserTypeSelector userType={userType} setUserType={setUserType} />
      {sseMessages.length > 0 && (
        <div>
          {sseMessages.map((message, index) => (
            <div key={index}>{message.counter}</div>
          ))}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
        />
        <MessageArea
          selectedConversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default MessageInterface;
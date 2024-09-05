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
  const [allConversations, setAllConversations] = useState<Conversation[]>(conversations);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sseMessages, setSseMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (selectedConversationIndex !== null) {
        const conversation = allConversations[selectedConversationIndex];
        const fullConversation = await getConversation(conversation.id);
        setMessages(fullConversation?.messages || []);
      } else {
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedConversationIndex, allConversations]);

  useEffect(() => {
    if (!user?.id) return;
    const eventSource = new EventSource(`/api/sse?id=${user.id}`);

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setSseMessages((prevMessages) => [...prevMessages, message]);
      setAllConversations((prevConversations) => {
        const updatedConversations = [...prevConversations];
        const index = updatedConversations.findIndex(conv => conv.id === message.conversationId);
        if (index !== -1) {
          updatedConversations[index].messages = [...updatedConversations[index].messages, message];
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

  const handleSendMessage = async (newMessageInput: string) => {
    if (selectedConversationIndex === null || !newMessageInput.trim()) return;

    const selectedConversation = allConversations[selectedConversationIndex];
    let receiverId: string;
    if (user?.id === selectedConversation?.participant1Id) {
      receiverId = selectedConversation?.participant2Id;
    } else {
      receiverId = selectedConversation?.participant1Id;
    }

    const newMessage = await createMessage({
      content: newMessageInput,
      senderRole: userType,
      conversationId: selectedConversation.id,
      receiverId: receiverId
    });

    setMessages([...messages, newMessage]);
  };

  const handleCreateConversation = async (email: string) => {
    if (!email.trim()) return;
    try {
      const newConversation = await createConversation(email);
      setAllConversations([...allConversations, newConversation]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // TODO: Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col">
      <UserTypeSelector userType={userType} setUserType={setUserType} />
      {sseMessages.length}
      {sseMessages.length > 0 && (
        <div>
          {sseMessages.map((message, index) => (
            <div key={index}>{message.context}</div>
          ))}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={allConversations}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
        />
        <MessageArea
          selectedConversation={selectedConversationIndex !== null ? allConversations[selectedConversationIndex] : null}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default MessageInterface;
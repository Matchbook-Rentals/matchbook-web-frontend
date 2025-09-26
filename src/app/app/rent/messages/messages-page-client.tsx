'use client';
import React from 'react';
import MessageInterface from './message-interface';
import WebSocketStatusIndicator from './components/WebSocketStatusIndicator';

interface ExtendedConversation {
  id: string;
  messages: any[];
  participants: {
    userId: string;
    role: string;
    User: { id: string; firstName?: string | null; email?: string | null; imageUrl?: string | null };
  }[];
  isUnread?: boolean;
}

interface MessagesPageClientProps {
  conversations: ExtendedConversation[];
  user: {
    id: string;
    imageUrl?: string | null;
  };
  initialIsMobile: boolean;
  isAdmin: boolean;
}

const MessagesPageClient: React.FC<MessagesPageClientProps> = ({
  conversations,
  user,
  initialIsMobile,
  isAdmin
}) => {
  return (
    <>
      <MessageInterface
        conversations={conversations}
        user={user}
        initialIsMobile={initialIsMobile}
      />
      {isAdmin && (
        <WebSocketStatusIndicator userId={user.id} />
      )}
    </>
  );
};

export default MessagesPageClient;
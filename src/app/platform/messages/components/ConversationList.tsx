import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Conversation } from '@prisma/client';
import { UserResource } from '@clerk/types';

// Define the conversation participant structure
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

// Define the extended conversation type
interface ExtendedConversation extends Conversation {
  messages: any[];
  participants: ConversationParticipant[];
}

interface ConversationListProps {
  conversations: ExtendedConversation[];
  onSelectConversation: (index: number) => void;
  onCreateConversation: (email: string) => void;
  user: UserResource;
  hasOtherRoleConversations?: boolean;
  otherRole?: string;
  currentRole?: string;
  onRoleSwitch?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user,
  hasOtherRoleConversations = false,
  otherRole = '',
  currentRole = '',
  onRoleSwitch
}) => {
  const getParticipantInfo = (conv: ExtendedConversation, currentUser: UserResource) => {
    if (!currentUser) return { displayName: "Loading...", imageUrl: "" };

    // Find the other participant in the conversation
    const otherParticipant = conv.participants.find(
      p => p.User.id !== currentUser.id
    );

    if (!otherParticipant) {
      return { displayName: "Unknown", imageUrl: "" };
    }

    const { User } = otherParticipant;
    let displayName = User.firstName && User.lastName
      ? `${User.firstName} ${User.lastName}`
      : User.email || "Unknown";

    return {
      displayName,
      imageUrl: User.imageUrl || ""
    };
  };

  return (
    <Card className="w-1/3 bg-gray-200 h-[75vh] flex flex-col pb-4">
      <CardHeader>
        <CardTitle className='text-center'>Conversations</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 mb-4">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv, index) => {
              const { displayName, imageUrl } = getParticipantInfo(conv, user);
              const lastMessage = conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;

              return (
                <Card
                  key={conv.id}
                  className="w-full mb-2 cursor-pointer border bg-background hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => onSelectConversation(index)}
                >
                  <CardContent className="p-4 flex items-start">
                    <img
                      onMouseOver={() => console.log(conv)}
                      src={imageUrl || "/placeholder-avatar.png"}
                      className="w-10 h-10 rounded-full mr-2 flex-shrink-0"
                      alt={displayName}
                    />
                    <div className="flex flex-col flex-grow min-w-0">
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs text-black">{displayName}</span>
                        <span className="text-xs text-black ml-2 flex-shrink-0">
                          {lastMessage ? new Date(lastMessage.updatedAt).toLocaleString() : 'No messages'}
                        </span>
                      </div>
                      <span className="text-md text-black truncate">
                        {lastMessage ? lastMessage.content : 'Start a conversation'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              {hasOtherRoleConversations ? (
                <>
                  <p className="text-center mb-4">
                    You don&apos;t have any {currentRole} messages.
                  </p>
                  <Button
                    variant="default"
                    onClick={onRoleSwitch}
                  >
                    Switch to {otherRole} messages
                  </Button>
                </>
              ) : (
                <p>No conversations yet.</p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationList;

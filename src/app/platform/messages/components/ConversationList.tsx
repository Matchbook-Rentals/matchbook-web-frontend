import React, { useState } from 'react';
import { Conversation } from '@prisma/client';
import { UserResource } from '@clerk/types';
import { Switch } from "@/components/ui/switch";

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
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const { displayName } = getParticipantInfo(conv, user);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-3 rounded-lg bg-gray-100 shadow-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Filter Switch */}
      <div className="px-4 pb-2 text-black">
        <div className="flex items-center space-x-2">
          <Switch
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
          <span className="text-sm font-medium">Show unread only</span>
        </div>
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv, index) => {
            const { displayName, imageUrl } = getParticipantInfo(conv, user);
            const lastMessage = conv.messages && conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1]
              : null;
            
            return (
              <div
                key={conv.id}
                className="w-full mb-3 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => onSelectConversation(index)}
              >
                <div className="p-3 flex items-start">
                  <img
                    src={imageUrl || "/placeholder-avatar.png"}
                    className="w-10 h-10 rounded-full mr-3 flex-shrink-0"
                    alt={displayName}
                  />
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start w-full">
                      <span className="font-semibold text-sm text-gray-800">{displayName}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {lastMessage ? new Date(lastMessage.updatedAt).toLocaleString(undefined, {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        }) : ''}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 truncate">
                      {lastMessage ? lastMessage.content : 'Start a conversation'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;

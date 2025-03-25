import React, { useState } from 'react';
import { Conversation } from '@prisma/client';
import { UserResource } from '@clerk/types';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

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
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user,
  onTabChange,
  activeTab = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const toggleUnreadOnly = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };
  
  // Helper function to check if a conversation has unread messages
  const hasUnreadMessages = (conv: ExtendedConversation) => {
    return conv.messages?.some(message => 
      message.senderId !== user.id && !message.isRead
    ) || false;
  };

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

  // Filter conversations based on search term and unread status
  const filteredConversations = conversations.filter(conv => {
    const { displayName } = getParticipantInfo(conv, user);
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase());

    // If showUnreadOnly is true, filter for conversations with unread messages
    if (showUnreadOnly) {
      // Check for any unread messages in the conversation
      // A message is considered unread if it's from the other participant (not current user)
      const hasUnreadMessages = conv.messages?.some(message => 
        message.senderId !== user.id && !message.isRead
      );
      
      return matchesSearch && hasUnreadMessages;
    }

    return matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-background flex border-r-2 p-1 pr-2 md:pr-[5vw] lg:pr-[2.5vw] min-w-[310px] w-full md:max-w-[400px] flex-col overflow-hidden">
      {/* Checkbox styling to ensure black fill when checked */}
      <style jsx>{`
        input[type="checkbox"]:checked {
          background-color: #000 !important;
          border-color: #000 !important;
        }
        input[type="checkbox"]:focus {
          --tw-ring-color: transparent !important;
        }
      `}</style>


      {/* Role Filter and Unread Toggle */}
      <div className=" pb-2 text-black">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => onTabChange?.(e.target.value)}
              className="appearance-none bg-black text-white border border-black rounded-full py-1 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Host">Host</option>
              <option value="Tenant">Renter</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="unreadOnlyCheckbox"
              checked={showUnreadOnly}
              onChange={toggleUnreadOnly}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-0 focus:ring-offset-0 mr-2 cursor-pointer accent-black"
            />
            <label htmlFor="unreadOnlyCheckbox" className="text-sm font-medium cursor-pointer select-none">
              Unread Only
            </label>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="pt-3 md:pt-0 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-3 rounded-lg bg-gray-100 shadow-md text-black focus:outline-none focus:ring-1 focus:ring-black"
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

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv, index) => {
            const { displayName, imageUrl } = getParticipantInfo(conv, user);
            const lastMessage = conv.messages && conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1]
              : null;

            return (
              <div
                key={conv.id}
                className={`w-full mb-3 ${hasUnreadMessages(conv) ? 'bg-gray-100' : 'bg-white'} rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200`}
                onClick={() => onSelectConversation(index)}
              >
                <div className="p-3 flex items-start">
                  <div className="relative">
                    <img
                      src={imageUrl || "/placeholder-avatar.png"}
                      className="w-10 h-10 rounded-full mr-3 flex-shrink-0"
                      alt={displayName}
                    />
                    {hasUnreadMessages(conv) && (
                      <div className="absolute top-0 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start w-full">
                      <span className={`font-semibold text-sm ${hasUnreadMessages(conv) ? 'text-black' : 'text-gray-800'} truncate`}>
                        {displayName}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {lastMessage ? new Date(lastMessage.updatedAt).toLocaleString(undefined, {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        }) : ''}
                      </span>
                    </div>
                    <span className={`text-sm ${hasUnreadMessages(conv) ? 'font-medium text-black' : 'text-gray-600'} truncate`}>
                      {lastMessage ? (lastMessage.content?.length > 20 ? `${lastMessage.content.substring(0, 20)}...` : lastMessage.content) : 'Start a conversation'}
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

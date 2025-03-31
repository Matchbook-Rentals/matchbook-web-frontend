import React, { useState } from 'react';
import { Conversation } from '@prisma/client';
import { UserResource } from '@clerk/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, Inbox, Home, Key, HeadphonesIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  listing?: {
    id: string;
    title: string;
  };
}

interface ConversationListProps {
  conversations: ExtendedConversation[];
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (email: string) => void;
  user: UserResource;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  selectedConversationId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user,
  onTabChange,
  activeTab = 'all',
  selectedConversationId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleUnreadOnly = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  // Helper function to check if a conversation has unread messages
  // Works with messages in any order since it uses 'some'
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
    const matchesSearch = displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

    // If showUnreadOnly is true, filter for conversations with unread messages
    if (showUnreadOnly) {
      // Use the hasUnreadMessages helper function we already defined
      return matchesSearch && hasUnreadMessages(conv);
    }

    return matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-background flex border-r-2 p-1 pr-2 pt-4 pl-[2.5vw] md:pr-[5vw] lg:pr-[2.5vw] min-w-[310px] w-full md:max-w-[450px] flex-col overflow-hidden">
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
      <div className="pb-2 text-black">
        <div className="flex items-center space-x-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-black text-white border-black rounded-full py-1 px-3 flex items-center gap-2">
                {activeTab === 'all' ? 'All' : activeTab}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  className="justify-start rounded-none"
                  onClick={() => {
                    onTabChange?.('all');
                    setOpen(false);
                  }}
                >
                  <Inbox className="mr-4 h-4 w-4" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start rounded-none"
                  onClick={() => {
                    onTabChange?.('Hosting');
                    setOpen(false);
                  }}
                >
                  <Home className="mr-4 h-4 w-4" />
                  Hosting
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start rounded-none"
                  onClick={() => {
                    onTabChange?.('Renting');
                    setOpen(false);
                  }}
                >
                  <Key className="mr-4 h-4 w-4" />
                  Renting
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start rounded-none"
                  onClick={() => {
                    onTabChange?.('Support');
                    setOpen(false);
                  }}
                >
                  <HeadphonesIcon className="mr-4 h-4 w-4" />
                  Support
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
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
      <div className="pt-3  pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search Messages"
            className="w-full p-2 pl-10 rounded-[15px] bg-gray-100 border-gray-400 text-black focus:outline-none focus:ring-1 focus:ring-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv, index) => {
            const { displayName, imageUrl } = getParticipantInfo(conv, user);
            // Since messages are now in reverse chronological order (newest first),
            // the newest message is the first one in the array
            const lastMessage = conv.messages && conv.messages.length > 0
              ? conv.messages[0]
              : null;

            return (
              <div
                key={conv.id}
                className={`w-full mb-3 rounded-lg cursor-pointer ${selectedConversationId === conv.id ? 'bg-gray-100' : ''} hover:bg-gray-100 transition-shadow duration-200`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="p-3 flex items-center h-full w-full">
                  <div className="relative flex-shrink-0">
                    <img
                      src={imageUrl || "/placeholder-avatar.png"}
                      className="w-11 h-11 rounded-full mr-3"
                      alt={displayName}
                    />
                    {hasUnreadMessages(conv) && (
                      <div className="absolute top-0 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 h-full py-1">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col min-w-0 flex-1 mr-2">
                        <span className="font-normal text-sm text-gray-600 truncate">
                          {displayName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                        {lastMessage ? new Date(lastMessage.updatedAt).toLocaleString(undefined, {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        }) : ''}
                      </span>
                    </div>
                    <span className={`text-sm font-normal text-gray-600 truncate max-w-[200px]`}>
                      {lastMessage ? (lastMessage.content?.length > 50 ? `${lastMessage.content.substring(0, 20)}...` : lastMessage.content) : 'Start a conversation'}
                    </span>
                    <span className="text-xs text-gray-600 truncate">
                      {conv.listingId ? (`${conv.listing?.title || "Cozy Downtown Apartment"}`) : "Property Discussion"}
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

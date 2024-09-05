import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Conversation, User } from '@prisma/client';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (index: number) => void;
  onCreateConversation: (email: string) => void;
  user: User | null; // Change to allow null
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user
}) => {
  const [newConversationEmail, setNewConversationEmail] = useState('');

  const getParticipantInfo = (conv: Conversation, user: User | null) => {
    if (!user) return { displayName: "Loading...", imageUrl: "" };

    const nonUserParticipant = conv.participant1Id === user.id ? conv.participant2 : conv.participant1;
    let displayName = nonUserParticipant.firstName + " " + nonUserParticipant.lastName;

    if (!nonUserParticipant.firstName && !nonUserParticipant.lastName) {
      displayName = nonUserParticipant.email;
    }

    return { displayName, imageUrl: nonUserParticipant.imageUrl };
  };

  const renderParticipantCard = (conv: Conversation) => {
    const { displayName, imageUrl } = getParticipantInfo(conv, user);

    return (
      <div className="flex flex-row">
        <img src={imageUrl} className="w-10 h-10 rounded-full mr-2" alt={displayName} />
        <span className="text-xs text-gray-300">{displayName}</span>
      </div>
    );
  };

  return (
    <Card className="w-1/3 bg-gray-300 h-[75vh] flex flex-col">
      <CardHeader>
        <CardTitle className='text-center'>Conversations</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 max-h-[50vh]">
          {conversations.map((conv, index) => {
            const { displayName, imageUrl } = getParticipantInfo(conv, user);
            return (
              <Card
                key={conv.id}
                className="w-full mb-2 cursor-pointer border bg-white"
                onClick={() => onSelectConversation(index)}
              >
                <CardContent className="p-4 flex items-start">
                  <img src={imageUrl} className="w-10 h-10 rounded-full mr-2 flex-shrink-0" alt={displayName} />
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start w-full">
                      <span className="text-xs text-gray-300">{displayName}</span>
                      <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                        {new Date(conv.messages[0].updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-md text-black truncate">{conv.messages[0].content}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </ScrollArea>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="w-full mt-2">New Conversation</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <h4 className="font-medium leading-none">Start a new conversation</h4>
              <Input
                type="email"
                placeholder="Enter recipient's email"
                value={newConversationEmail}
                onChange={(e) => setNewConversationEmail(e.target.value)}
              />
              <Button onClick={() => {
                onCreateConversation(newConversationEmail);
                setNewConversationEmail('');
              }}>Create</Button>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
};

export default ConversationList;
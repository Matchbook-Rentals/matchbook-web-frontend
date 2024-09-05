import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Conversation } from '@prisma/client';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (index: number) => void;  // Changed to accept index
  onCreateConversation: (email: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation
}) => {
  const [newConversationEmail, setNewConversationEmail] = useState('');

  return (
    <div className="w-1/3 border-r flex flex-col h-[75vh]">
      <ScrollArea className="flex-1 max-h-[60vh] px-8">
        {conversations.map((conv, index) => (  // Added index parameter
          <Button
            key={conv.id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onSelectConversation(index)}  // Changed to pass index
          >
            {`Conversation ${index + 1}`}
          </Button>
        ))}
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
    </div>
  );
};

export default ConversationList;
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface MessageAreaProps {
  selectedConversation: string | null;
  messages: any[];
  onSendMessage: (message: string) => void;
  currentUserId: string | undefined;
}

const MessageArea: React.FC<MessageAreaProps> = ({
  selectedConversation,
  messages,
  onSendMessage,
  currentUserId
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');

  const handleSend = () => {
    if (newMessageInput.trim()) {
      onSendMessage(newMessageInput);
      setNewMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      {selectedConversation ? (
        <ScrollArea className="flex-1">
          {messages.map((message) => (
            <div key={message.id} className={`mb-2 ${message.senderId === currentUserId ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded ${message.senderId === currentUserId
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
                }`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
      ) : (
        <div className="flex-1">Select a conversation</div>
      )}
      <div className="flex mt-4">
        <input
          type="text"
          className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={newMessageInput}
          onChange={(e) => setNewMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button className="rounded-l-none" onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};

export default MessageArea;
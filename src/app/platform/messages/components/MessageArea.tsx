import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MessageAreaProps {
  selectedConversation: string | null;
  messages: any[];
  onSendMessage: (message: string, imgUrl?: string) => void;
  currentUserId: string | undefined;
}

interface UploadData {
  name: string;
  size: number;
  key: string;
  serverData: {
    uploadedBy: string;
    fileUrl: string;
  };
  url: string;
  customId: string | null;
  type: string;
}

const MessageArea: React.FC<MessageAreaProps> = ({
  selectedConversation,
  messages,
  onSendMessage,
  currentUserId
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessageInput.trim()) {
      // Only pass the attachment if it exists
      const attachment = messageAttachments.length > 0 ? messageAttachments[0] : undefined;
      onSendMessage(newMessageInput, attachment);
      setNewMessageInput('');
      setMessageAttachments([]);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleUploadFinish = (res: UploadData[]) => {
    setMessageAttachments(prev => [...prev, ...res.map(r => r.url)]);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      {selectedConversation ? (
        <ScrollArea className="flex-1 max-h-[40vh] px-8">
          {messages.map((message) => (
            <div key={message.id} className={`mb-2 ${message.senderId === currentUserId ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded ${message.senderId === currentUserId
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
                }`}>
                {message.imgUrl && (
                  <div className="mb-2">
                    <Image
                      src={message.imgUrl}
                      alt="Message Attachment"
                      width={200}
                      height={200}
                      className="rounded cursor-pointer"
                      onClick={() => handleImageClick(message.imgUrl)}
                    />
                  </div>
                )}
                <div>{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Select a conversation or start a new one</p>
        </div>
      )}
      <div className="flex mt-4 items-center">
        {messageAttachments.map((attachment, index) => (
          <div key={index} className="inline-block p-2 rounded bg-gray-200">
            <Image
              src={attachment}
              alt="Message Attachment"
              width={100}
              height={100}
              className="cursor-pointer"
              onClick={() => handleImageClick(attachment)}
            />
          </div>
        ))}
        <input
          type="text"
          className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={newMessageInput}
          onChange={(e) => setNewMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!selectedConversation}
        />
        <div className={!selectedConversation ? "opacity-50 pointer-events-none" : ""}>
          <UploadButton
            endpoint="messageUploader"
            onClientUploadComplete={handleUploadFinish}
            onUploadError={(error) => alert(error.message)}
            className="p-0 mt-5"
            content={{
              button: <PaperclipIcon className="w-6 h-6" />,
              allowedContent: 'Image upload'
            }}
            appearance={{
              button: 'bg-parent text-black focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-primaryBrand',
              allowedContent: ''
            }}
          />
        </div>
        <Button
          className="rounded-l-none"
          onClick={handleSend}
          disabled={!selectedConversation || !newMessageInput.trim()}
        >
          Send
        </Button>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl" hideCloseButton={false}>
          {selectedImage && (
            <div className="flex justify-center items-center">
              <Image
                src={selectedImage}
                alt="Enlarged Image"
                width={800}
                height={800}
                className="max-h-[80vh] w-auto object-contain mt-6"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageArea;
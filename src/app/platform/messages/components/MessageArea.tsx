import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, MicIcon, ArrowLeftIcon } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MessageAreaProps {
  selectedConversation: any;
  messages: any[];
  onSendMessage: (message: string, imgUrl?: string) => void;
  currentUserId: string | undefined;
  onBack?: () => void;
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
  currentUserId,
  onBack
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

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

  // Get participant info for the header
  const getParticipantInfo = () => {
    if (!selectedConversation || !selectedConversation.participants) {
      return { displayName: "Unknown", imageUrl: "" };
    }

    // Find the other participant who isn't the current user
    const otherParticipant = selectedConversation.participants.find(
      (p: any) => p.User.id !== currentUserId
    );

    if (!otherParticipant) {
      return { displayName: "Unknown", imageUrl: "" };
    }

    const { User } = otherParticipant;
    const displayName = User.firstName && User.lastName
      ? `${User.firstName} ${User.lastName}`
      : User.email || "Unknown";

    return {
      displayName,
      imageUrl: User.imageUrl || "/placeholder-avatar.png"
    };
  };

  // Get participant info if we have a selected conversation
  const participantInfo = selectedConversation ? getParticipantInfo() : { displayName: "", imageUrl: "" };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      {selectedConversation ? (
        <div className="bg-[#4A90E2]  p-4 flex items-center shadow-md">
          {onBack && (
            <button onClick={onBack} className="mr-3 md:hidden">
              <ArrowLeftIcon size={20} />
            </button>
          )}
          <img 
            src={participantInfo.imageUrl} 
            alt={participantInfo.displayName} 
            className="w-10 h-10 rounded-full mr-3" 
          />
          <span className="font-medium">{participantInfo.displayName}</span>
        </div>
      ) : (
        <div className="bg-[#4A90E2]  p-4 flex items-center shadow-md">
          {onBack && (
            <button onClick={onBack} className="mr-3 md:hidden">
              <ArrowLeftIcon size={20} />
            </button>
          )}
          <span className="font-medium">Select a conversation</span>
        </div>
      )}

      {/* Message Area */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {selectedConversation ? (
          messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-4`}>
                {message.senderId !== currentUserId && (
                  <img
                    src={participantInfo.imageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full mr-2 self-end"
                  />
                )}
                <div 
                  className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                    message.senderId === currentUserId 
                      ? 'bg-white text-black' 
                      : 'bg-gray-200 text-black'
                  }`}
                >
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
                {message.senderId === currentUserId && (
                  <img
                    src={"/placeholder-avatar.png"} // Use current user avatar
                    alt="Your profile"
                    className="w-8 h-8 rounded-full ml-2 self-end"
                  />
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input Area */}
      <div className="p-4 bg-background">
        {/* Display message attachments */}
        <div className="flex flex-wrap gap-2 mb-2">
          {messageAttachments.map((attachment, index) => (
            <div key={index} className="inline-block p-2 rounded bg-white">
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
        </div>

        {/* Input and buttons flex container */}
        <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
          <input
            type="text"
            className="flex-1 px-4 py-3 focus:outline-none text-black"
            placeholder="Type a message..."
            value={newMessageInput}
            onChange={(e) => setNewMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!selectedConversation}
          />
          
          <div className="flex items-center px-2">
            <div className={`p-2 ${!selectedConversation ? "opacity-50 pointer-events-none" : ""}`}>
              <UploadButton
                endpoint="messageUploader"
                onClientUploadComplete={handleUploadFinish}
                onUploadError={(error) => alert(error.message)}
                className="p-0"
                content={{
                  button: <PaperclipIcon className="w-5 h-5 text-gray-600" />,
                  allowedContent: 'Image upload'
                }}
                appearance={{
                  button: 'bg-parent focus-within:ring-primaryBrand data-[state="uploading"]:after:bg-[#404040]',
                  allowedContent: 'hidden'
                }}
              />
            </div>
            
            <button
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              disabled={!selectedConversation}
            >
              <MicIcon className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 mx-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              onClick={handleSend}
              disabled={!selectedConversation || !newMessageInput.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
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

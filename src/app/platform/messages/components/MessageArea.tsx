import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, ArrowLeftIcon, X } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileObject, FilePreview } from '@/components/ui/file-preview';
import { isImageFile, getFileUrl } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageAreaProps {
  selectedConversation: any;
  messages: any[];
  onSendMessage: (message: string, fileUrl?: string, fileName?: string, fileKey?: string, fileType?: string) => void;
  currentUserId: string | undefined;
  currentUserImage?: string | null;
  onBack?: () => void;
}

interface MessageFile {
  fileUrl: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
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
  currentUserImage = "/placeholder-avatar.png",
  onBack
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<MessageFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MessageFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      // MD breakpoint in Tailwind is 768px
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Focus textarea when conversation is selected
  useEffect(() => {
    if (selectedConversation && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      setIsExiting(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    return () => {
      setIsExiting(false);
    };
  }, []);

  const handleBackClick = () => {
    if (isMobile) {
      setIsExiting(true);

      setTimeout(() => {
        if (onBack) {
          onBack();
        }

        setTimeout(() => {
          setIsExiting(false);
        }, 50);
      }, 300);
    } else if (onBack) {
      onBack();
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current && bottomRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = () => {
    console.log('=== HANDLE SEND ===');
    console.log('Message input:', newMessageInput);
    console.log('Message attachments:', messageAttachments);
    
    if (newMessageInput.trim() || messageAttachments.length > 0) {
      if (messageAttachments.length > 0) {
        const attachment = messageAttachments[0];
        console.log('Sending message with attachment:', attachment);
        // With the database change, we can now send empty content with attachments
        const messageContent = newMessageInput.trim() || ""; // Empty string is fine now
        console.log('Message content to send:', messageContent ? `"${messageContent}"` : '<empty string>');
        onSendMessage(
          messageContent,
          attachment.fileUrl,
          attachment.fileName,
          attachment.fileKey,
          attachment.fileType
        );
      } else {
        console.log('Sending text-only message');
        onSendMessage(newMessageInput);
      }

      setNewMessageInput('');
      setMessageAttachments([]);
    } else {
      console.log('No content to send');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadFinish = (res: UploadData[]) => {
    console.log('=== UPLOAD FINISH ===', res);
    const attachments = res.map(r => ({
      fileUrl: r.url,
      fileName: r.name,
      fileKey: r.key,
      fileType: r.type
    }));
    console.log('Setting message attachments:', attachments);
    setMessageAttachments(prev => [...prev, ...attachments]);
  };

  const handleFileClick = (file: MessageFile) => {
    setSelectedFile(file);
  };

  const getParticipantInfo = () => {
    if (!selectedConversation || !selectedConversation.participants) {
      return { displayName: "Unknown", imageUrl: "" };
    }

    const otherParticipant = selectedConversation.participants.find(
      (p: any) => p.User.id !== currentUserId
    );

    if (!otherParticipant) {
      return { displayName: "Unknown", imageUrl: "" };
    }

    const { User } = otherParticipant;
    const displayName = User.fullName
      ? User.fullName
      : User.firstName && User.lastName
        ? `${User.firstName} ${User.lastName}`
        : User.firstName || User.lastName || User.email || "Unknown";

    return {
      displayName,
      imageUrl: User.imageUrl || "/placeholder-avatar.png"
    };
  };

  const participantInfo = selectedConversation ? getParticipantInfo() : { displayName: "", imageUrl: "" };

  // Create the className string explicitly
  const messageContainerClassName = `flex flex-col pl-2 h-[calc(100vh-65px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-80px)] bg-background ${isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''
    } ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

  return (
    // Main container
    <div className={messageContainerClassName}>

      {/* Header Section - Shows participant info when conversation is selected */}
      {selectedConversation && (
        <div className="bg-blueBrand/10 w-full mx-auto p-2 md:p-4 relative flex md:flex-row md:justify-center items-center shadow-md">
          {onBack && (
            <button onClick={handleBackClick} className="absolute left-2 md:hidden">
              <ArrowLeftIcon size={20} />
            </button>
          )}

          <div className="flex items-center justify-center w-full md:justify-center">
            <img
              src={participantInfo.imageUrl}
              alt={participantInfo.displayName}
              className="aspect-square w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full mr-2 sm:mr-4 md:mr-6 lg:mr-8"
            />
            <div className="flex flex-col">
              <span className="overflow-hidden text-[#212121] max-w-[90%] truncate text-base sm:text-lg md:text-xl lg:text-[20px] font-bold leading-tight">{participantInfo.displayName}</span>
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">I forgot to put listings in the conversation table</span>
            </div>
          </div>
        </div>
      
      )}

      {/* Messages Container */}
      <div className="flex-1 relative overflow-hidden ">

        {/* Gradient overlay at the top of messages */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

        <ScrollArea
          ref={scrollAreaRef}
          className="h-full overflow-hidden" >

          {/* Messages Content */}
          <div ref={messageContainerRef} className="p-2 md:p-4 min-h-full">
            {selectedConversation ? (
              messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-4`}>
                    {message.senderId !== currentUserId && (
                      <img
                        src={participantInfo.imageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full mr-2 self-center"
                      />
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-md ${message.senderId === currentUserId
                          ? 'bg-white text-black'
                          : 'bg-gray-200 text-black'
                        }`}
                    >
                      {message.imgUrl && (
                        <div className={message.content ? "mb-2" : ""}>
                          {isImageFile(message.fileName || '') ? (
                            <Image
                              src={message.imgUrl}
                              alt="Message Attachment"
                              width={200}
                              height={200}
                              className="rounded cursor-pointer"
                              onClick={() => handleFileClick({
                                fileUrl: message.imgUrl,
                                fileName: message.fileName || 'attachment',
                                fileKey: message.fileKey,
                                fileType: message.fileType
                              })}
                            />
                          ) : (
                            <FilePreview
                              file={{
                                fileUrl: message.imgUrl,
                                fileKey: message.fileKey || message.imgUrl,
                                fileName: message.fileName || 'attachment',
                                fileType: message.fileType
                              }}
                              previewSize="small"
                              allowPreview={false}
                              onClick={() => handleFileClick({
                                fileUrl: message.imgUrl,
                                fileName: message.fileName || 'attachment',
                                fileKey: message.fileKey,
                                fileType: message.fileType
                              })}
                            />
                          )}
                        </div>
                      )}
                      {message.content && <div>{message.content}</div>}
                    </div>
                    {message.senderId === currentUserId && (
                      <img
                        src={currentUserImage || "/placeholder-avatar.png"}
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
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input Section */}
      <div className="p-4 bg-background">

        {/* Attachments Preview Area */}
        <div className="flex flex-wrap gap-2 mb-2">
          {messageAttachments.map((attachment, index) => (
            <div key={index} className="inline-block rounded">
              {isImageFile(attachment.fileName || '') ? (
                <div className="p-2 bg-white relative">
                  <button 
                    className="absolute top-1 right-1 z-10 w-6 h-6 bg-white/80 hover:bg-white/90 rounded-full flex items-center justify-center"
                    onClick={() => {
                      setMessageAttachments(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <X size={14} />
                  </button>
                  <Image
                    src={attachment.fileUrl}
                    alt="Message Attachment"
                    width={100}
                    height={100}
                    className="cursor-pointer"
                    onClick={() => handleFileClick(attachment)}
                  />
                </div>
              ) : (
                <FilePreview
                  file={{
                    fileUrl: attachment.fileUrl,
                    fileKey: attachment.fileKey || attachment.fileUrl,
                    fileName: attachment.fileName || 'attachment',
                    fileType: attachment.fileType
                  }}
                  previewSize="small"
                  allowPreview={false}
                  showRemove={true}
                  onRemove={() => {
                    setMessageAttachments(prev => prev.filter((_, i) => i !== index));
                  }}
                  onClick={() => handleFileClick(attachment)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Message Input Bar */}
        <div 
          className="flex items-center bg-white shadow-lg overflow-hidden transition-[border-radius] duration-200 ease-in-out" 
          style={{ borderRadius: newMessageInput.length > 80 ? '1.25rem' : '9999px' }}
        >
          <textarea
            ref={textareaRef}
            className="flex-1 px-5 py-3 focus:outline-none text-black resize-none min-h-[44px] max-h-[132px] overflow-y-auto leading-relaxed"
            placeholder="Type a message..."
            value={newMessageInput}
            onChange={(e) => {
              setNewMessageInput(e.target.value);
              // Auto-resize textarea up to 3x original height
              e.target.style.height = "44px"; // Reset height
              const scrollHeight = e.target.scrollHeight;
              const newHeight = Math.min(scrollHeight, 132); // 3x the original 44px
              e.target.style.height = `${newHeight}px`;
            }}
            onKeyPress={handleKeyPress}
            disabled={!selectedConversation}
            rows={1}
          />

          {/* Action Buttons Container */}
          <div className="flex items-center px-2">
            <div className={`p-2 ${!selectedConversation ? "opacity-50 pointer-events-none" : ""}`}>
              <UploadButton
                endpoint="messageUploader"
                onClientUploadComplete={handleUploadFinish}
                onUploadError={(error) => alert(error.message)}
                className="p-0"
                content={{
                  button({ ready, isUploading }) {
                    return (
                      <div className="relative">
                        {!isUploading && <PaperclipIcon className="w-5 h-5 text-gray-600" />}
                        {isUploading && (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                    );
                  },
                  allowedContent: 'Image upload'
                }}
                appearance={{
                  button: 'bg-parent focus-within:ring-black w-8 data-[state="uploading"]:after:hidden',
                  allowedContent: 'hidden'
                }}
              />
            </div>

            <button
              className="p-2 mx-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              onClick={handleSend}
              disabled={!selectedConversation || (!newMessageInput.trim() && messageAttachments.length === 0)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-3xl" hideCloseButton={false}>
          {selectedFile && (
            <div className="flex flex-col justify-center items-center">
              <h3 className="text-lg font-medium mb-4">{selectedFile.fileName}</h3>
              {isImageFile(selectedFile.fileName || '') ? (
                <Image
                  src={selectedFile.fileUrl}
                  alt="Enlarged Image"
                  width={800}
                  height={800}
                  className="max-h-[70vh] w-auto object-contain"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center">
                  <FilePreview
                    file={{
                      fileUrl: selectedFile.fileUrl,
                      fileKey: selectedFile.fileKey || selectedFile.fileUrl,
                      fileName: selectedFile.fileName || 'attachment',
                      fileType: selectedFile.fileType,
                    }}
                    previewSize="large"
                    allowDownload={true}
                    allowPreview={false}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageArea;

import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, ArrowLeftIcon, X } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileObject, FilePreview } from '@/components/ui/file-preview';
import { isImageFile, getFileUrl } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { UserRating } from '@/components/reviews/host-review';

interface MessageAreaProps {
  selectedConversation: any;
  messages: any[];
  onSendMessage: (message: string, fileUrl?: string, fileName?: string, fileKey?: string, fileType?: string) => void;
  currentUserId: string | undefined;
  currentUserImage?: string | null;
  onBack?: () => void;
  onTyping?: (isTyping: boolean) => void;
  isOtherUserTyping?: boolean;
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
  onBack,
  onTyping,
  isOtherUserTyping = false
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation && textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    if (selectedConversation) {
      setIsExiting(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    return () => {
      setIsExiting(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleBackClick = () => {
    if (!onBack) return;
    
    if (isMobile) {
      setIsExiting(true);
      setTimeout(() => {
        onBack();
        setTimeout(() => {
          setIsExiting(false);
        }, 100);
      }, 250);
    } else {
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
    const hasContent = newMessageInput.trim() || messageAttachments.length > 0;
    if (!hasContent) return;
    
    if (messageAttachments.length > 0) {
      const attachment = messageAttachments[0];
      const messageContent = newMessageInput.trim() || "";
      onSendMessage(
        messageContent,
        attachment.fileUrl,
        attachment.fileName,
        attachment.fileKey,
        attachment.fileType
      );
    } else {
      onSendMessage(newMessageInput);
    }

    setNewMessageInput('');
    setMessageAttachments([]);
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
  
  const renderFileAttachment = (fileUrl: string, fileName: string = 'attachment', fileKey?: string, fileType?: string) => {
    const fileObject = {
      fileUrl,
      fileName,
      fileKey,
      fileType
    };
    
    if (isImageFile(fileName)) {
      return (
        <Image
          src={fileUrl}
          alt="Message Attachment"
          width={250}
          height={250}
          className="rounded cursor-pointer"
          onClick={() => handleFileClick(fileObject)}
        />
      );
    }
    
    return (
      <FilePreview
        file={{
          fileUrl,
          fileKey: fileKey || fileUrl,
          fileName,
          fileType
        }}
        previewSize="small"
        allowPreview={false}
        onClick={() => handleFileClick(fileObject)}
      />
    );
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
    let displayName = "Unknown";
    
    if (User.fullName) {
      displayName = User.fullName;
    } else if (User.firstName && User.lastName) {
      displayName = `${User.firstName} ${User.lastName}`;
    } else if (User.firstName || User.lastName) {
      displayName = User.firstName || User.lastName;
    } else if (User.email) {
      displayName = User.email;
    }

    return {
      displayName,
      imageUrl: User.imageUrl || "/placeholder-avatar.png"
    };
  };

  const participantInfo = selectedConversation ? getParticipantInfo() : { displayName: "", imageUrl: "" };

  const renderMessageContent = () => {
    if (!selectedConversation) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm text-center max-w-md">
            <p className="text-gray-500 text-sm">Select a conversation from the list to get started</p>
          </div>
        </div>
      );
    }
    
    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm text-center max-w-md">
            <p className="text-gray-700 mb-3">No messages yet.</p>
            <p className="text-gray-500 text-sm">Send a message to start the conversation!</p>
          </div>
        </div>
      );
    }
    
    return messages.map((message) => {
      // Check if message contains only an image and no text content
      const isImageOnlyMessage = message.imgUrl && isImageFile(message.fileName || '') && !message.content;
      const isCurrentUser = message.senderId === currentUserId;
      const justifyClass = isCurrentUser ? 'justify-end' : 'justify-start';
      
      const messageFile = {
        fileUrl: message.imgUrl,
        fileName: message.fileName || 'attachment',
        fileKey: message.fileKey,
        fileType: message.fileType
      };
      
      const showSenderAvatar = !isCurrentUser && !isImageOnlyMessage;
      const bubbleStyles = isCurrentUser
        ? 'bg-gray-700 text-white border-white/10 pl-5 pr-5 font-normal rounded-br-none'
        : 'bg-gray-100 pr-5 pl-5 rounded-bl-none font-normal border-gray-200';
      
      const renderMessageStatus = () => {
        if (message.pending) {
          return <span className="text-xs text-gray-400">Sending...</span>;
        }
        
        if (message.failed) {
          return <span className="text-xs text-red-500">Failed to send</span>;
        }
        
        const isLastUserMessage = message === messages
          .filter(m => m.senderId === currentUserId)
          .slice(-1)[0];
          
        if (isLastUserMessage) {
          const readStatus = message.isRead 
            ? `Read ${new Date(message.updatedAt).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`
            : "Delivered";
          return <span className="text-xs text-gray-400">{readStatus}</span>;
        }
        
        return null;
      };
      
      return (
        <div key={message.id} className="mb-3">
          <div className={`flex ${justifyClass}`}>
            {showSenderAvatar && (
              <div className="relative">
                <img
                  src={participantInfo.imageUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full mr-2 absolute bottom-[-12px]"
                />
                <div className="w-8 mr-3" />
              </div>
            )}
            
            {isImageOnlyMessage ? (
              // Image-only message without chat bubble
              <div className="max-w-[70%] mt-6">
                <Image
                  src={message.imgUrl}
                  alt="Message Attachment"
                  width={375}
                  height={375}
                  className="cursor-pointer rounded-lg"
                  onClick={() => handleFileClick(messageFile)}
                />
              </div>
            ) : (
              // Message with chat bubble
              <div
                className={`max-w-[70%] text-black rounded-2xl py-3 border leading-snug shadow-md overflow-hidden ${bubbleStyles}`}
              >
                {message.imgUrl && (
                  <div className={message.content ? "mb-2" : ""}>
                    {renderFileAttachment(
                      message.imgUrl,
                      message.fileName || 'attachment',
                      message.fileKey,
                      message.fileType
                    )}
                  </div>
                )}
                {message.content && (
                  <div 
                    className="break-words break-all whitespace-pre-wrap max-w-full overflow-hidden text-wrap font-jakarta" 
                    style={{ wordBreak: 'break-word', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isCurrentUser && renderMessageStatus() && (
            <div className={`flex ${justifyClass} mt-1`}>
              <div className="text-right mr-1">
                {renderMessageStatus()}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const renderFullSizeFile = () => {
    if (!selectedFile) return null;
    
    const fileObject = {
      fileUrl: selectedFile.fileUrl,
      fileKey: selectedFile.fileKey || selectedFile.fileUrl,
      fileName: selectedFile.fileName || 'attachment',
      fileType: selectedFile.fileType,
    };
    
    if (isImageFile(selectedFile.fileName || '')) {
      return (
        <Image
          src={selectedFile.fileUrl}
          alt="Enlarged Image"
          width={800}
          height={800}
          className="max-h-[70vh] w-auto object-contain"
          priority
        />
      );
    }
    
    return (
      <div className="flex flex-col items-center">
        <FilePreview
          file={fileObject}
          previewSize="large"
          allowDownload={true}
          allowPreview={false}
        />
      </div>
    );
  };
  
  const messageContainerClassName = `flex flex-col  h-[calc(100vh-65px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-80px)] bg-background w-full ${isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''} ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

  return (
    <div className={messageContainerClassName}>
      <div className='h-[72px] border-b-2 flex items-center'>
        {selectedConversation ? (
          <div className="w-full relative flex items-center pr-4">
            {onBack && (
              <button
                onClick={handleBackClick}
                className="absolute left-4 md:hidden flex items-center justify-center rounded-full bg-transparent"
              >
                <ArrowLeftIcon size={20} />
              </button>
            )}
            <div className="flex items-center justify-center w-full md:justify-start md:pl-[calc(2.5vw+7px)]">
              <img
                src={participantInfo.imageUrl}
                alt={participantInfo.displayName}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div className="flex justify-between w-full gap-4">
                <p className="overflow-hidden text-[#212121] max-w-[200px] md:max-w-[500px] truncate text-base sm:text-lg md:text-xl lg:text-[18px] font-medium leading-tight">{participantInfo.displayName}</p>
                <Dialog>
                  <DialogTrigger>
                    <Button>
                      Show Review
                    </Button>

                  </DialogTrigger>
                  <DialogContent className='' >
                    <UserRating avatarImgUrl={participantInfo.imageUrl}/>

                  </DialogContent>

                </Dialog>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blueBrand/10 w-full mx-auto p-4 flex items-center md:hidden shadow-md">
            {onBack && isMobile && (
              <button
                onClick={handleBackClick}
                className="md:hidden flex items-center justify-center p-2 rounded-full bg-transparent"
              >
                <ArrowLeftIcon size={20} />
              </button>
            )}
            <div className="w-full text-center font-medium">
              Select a conversation
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full overflow-hidden">
          <div ref={messageContainerRef} className="p-2 md:pl-[calc(2.5vw+7px)]  min-h-full">
            {renderMessageContent()}
            {isOtherUserTyping && (
              <div className="flex justify-start mb-4 mt-4">
                <div className="relative">
                  <img
                    src={participantInfo.imageUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full mr-3 absolute bottom-[-12px]"
                  />
                  <div className="w-8 mr-3" />
                </div>
                <div className="max-w-[70%] bg-gray-100 shadow-md pl-5 pr-5 rounded-[15px] rounded-bl-none pt-3 pb-2 border border-gray-200">
                  <div className="flex space-x-1 items-center h-5 mb-[2px]">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      <div className="py-1 px-12 bg-background">
        <div className="flex flex-wrap justify-end gap-2 mb-2">
          {messageAttachments.map((attachment, index) => {
            const handleRemove = () => {
              setMessageAttachments(prev => prev.filter((_, i) => i !== index));
            };
            
            const isImage = isImageFile(attachment.fileName || '');
            const fileObject = {
              fileUrl: attachment.fileUrl,
              fileKey: attachment.fileKey || attachment.fileUrl,
              fileName: attachment.fileName || 'attachment',
              fileType: attachment.fileType
            };
            
            return (
              <div key={index} className="inline-block rounded">
                {isImage ? (
                  <div className="p-2 bg-white relative">
                    <button
                      className="absolute top-1 right-1 z-10 w-6 h-6 bg-white/80 hover:bg-white/90 rounded-full flex items-center justify-center"
                      onClick={handleRemove}
                    >
                      <X size={14} />
                    </button>
                    <Image
                      src={attachment.fileUrl}
                      alt="Message Attachment"
                      width={375}
                      height={375}
                      className="cursor-pointer"
                      onClick={() => handleFileClick(attachment)}
                    />
                  </div>
                ) : (
                  <FilePreview
                    file={fileObject}
                    previewSize="small"
                    allowPreview={false}
                    showRemove={true}
                    onRemove={handleRemove}
                    onClick={() => handleFileClick(attachment)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center bg-white border-gray-300 border focus:outline-none focus:ring-1 focus:ring-black overflow-hidden transition-[border-radius] duration-200 ease-in-out"
          style={{ borderRadius: newMessageInput.length > 80 ? '1.25rem' : '9999px' }}
        >
          <textarea
            ref={textareaRef}
            className="flex-1 px-5 py-3 focus:outline-none text-black resize-none min-h-[44px] max-h-[132px] overflow-y-auto leading-relaxed font-jakarta"
            placeholder="Type a message..."
            value={newMessageInput}
            onChange={(e) => {
              setNewMessageInput(e.target.value);
              const textarea = e.target;
              textarea.style.height = "44px";
              const scrollHeight = textarea.scrollHeight;
              if (scrollHeight > 44) {
                const newHeight = Math.min(scrollHeight, 132);
                textarea.style.height = `${newHeight}px`;
              }
              if (onTyping && selectedConversation) {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                onTyping(true);
                typingTimeoutRef.current = setTimeout(() => {
                  if (onTyping) {
                    onTyping(false);
                  }
                }, 3000);
              }
            }}
            onKeyPress={handleKeyPress}
            disabled={!selectedConversation}
            rows={1}
          />

          <div className="flex items-center px-2">
            <div className={`p-2 ${!selectedConversation ? "opacity-50 pointer-events-none" : ""}`}>
              <UploadButton
                endpoint="messageUploader"
                onClientUploadComplete={handleUploadFinish}
                onUploadError={(error) => alert(error.message)}
                className="p-0"
                content={{
                  button: ({ ready, isUploading }) => (
                    <div className="relative">
                      {!isUploading && <PaperclipIcon className="w-5 h-5 text-gray-600" />}
                      {isUploading && (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      )}
                    </div>
                  ),
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

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-3xl" hideCloseButton={false}>
          {selectedFile && (
            <div className="flex flex-col justify-center items-center">
              <h3 className="text-lg font-medium mb-4">{selectedFile.fileName}</h3>
              {renderFullSizeFile()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageArea;

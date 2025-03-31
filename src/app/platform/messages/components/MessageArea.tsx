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
    if (isMobile) {
      setIsExiting(true);
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
        setTimeout(() => {
          setIsExiting(false);
        }, 100);
      }, 250);
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
        const messageContent = newMessageInput.trim() || "";
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

  const messageContainerClassName = `flex flex-col h-[calc(100vh-65px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-80px)] bg-background w-full ${isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''} ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

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
                <p className="overflow-hidden text-[#212121] max-w-[200px] md:max-w-[500px] truncate text-base sm:text-lg md:text-xl lg:text-[20px] font-bold leading-tight">{participantInfo.displayName}</p>
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
          <div ref={messageContainerRef} className="p-2 md:pl-[calc(2.5vw+7px)] md:pr-[calc(2.5vw+7px)] min-h-full">
            {selectedConversation ? (
              messages && messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-2`}>
                    {message.senderId !== currentUserId && (
                      <div className="relative">
                        <img
                          src={participantInfo.imageUrl}
                          alt="Profile"
                          className="w-9 h-9 rounded-full mr-2 absolute bottom-[-12px]"
                        />
                        <div className="w-8 mr-3" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] text-black rounded-2xl py-3 border leading-snug   overflow-hidden ${
                        message.senderId === currentUserId
                          ? 'bg-gray-900 shadow-md text-white border-white/10 pl-5 pr-5 font-normal rounded-br-none'
                          : 'bg-gray-100 pr-5 pl-5 rounded-bl-none font-normal border-gray-200'
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
                      {message.content && <div className="break-words break-all whitespace-pre-wrap max-w-full overflow-hidden text-wrap font-jakarta" style={{ wordBreak: 'break-word', fontFamily: 'Poppins, sans-serif' }}>{message.content}</div>}
                      {message.senderId === currentUserId && (
                        <div className="flex justify-end mt-1">
                          {message.pending ? (
                            <span className="text-xs text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="6" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </span>
                          ) : message.failed ? (
                            <span className="text-xs text-red-500 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            </span>
                          ) : message.isRead ? (
                            <span className="text-xs text-blue-500 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <circle cx="12" cy="12" r="10" fill="white" />
                                <polyline points="7 13 10 16 17 9" stroke="#404040" />
                              </svg>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="7 13 10 16 17 9" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {message.senderId === currentUserId && (
                      <div className="relative">
                        <img
                          src={currentUserImage || "/placeholder-avatar.png"}
                          alt="Your profile"
                          className="w-8 h-8 rounded-full ml-2 absolute bottom-[-12px]"
                        />
                        <div className="w-8 ml-2" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-gray-50 rounded-lg p-6 shadow-sm text-center max-w-md">
                    <p className="text-gray-700 mb-3">No messages yet.</p>
                    <p className="text-gray-500 text-sm">Send a message to start the conversation!</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm text-center max-w-md">
                  <p className="text-gray-500 text-sm">Select a conversation from the list to get started</p>
                </div>
              </div>
            )}
            {isOtherUserTyping && (
              <div className="flex justify-start mb-4">
                <div className="relative">
                  <img
                    src={participantInfo.imageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full mr-2 absolute bottom-[-12px]"
                  />
                  <div className="w-8 mr-2" />
                </div>
                <div className="max-w-[70%] bg-[#AC8D9015] pl-5 pr-5 rounded-[15px] rounded-bl-none py-[6px] border border-gray-200">
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

      <div className="p-4 bg-background">
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

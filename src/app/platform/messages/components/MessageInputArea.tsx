import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, X } from 'lucide-react';
import Image from "next/image";
import { FilePreview } from '@/components/ui/file-preview';
import { isImageFile } from '@/lib/utils';
import { useWindowSize } from '@/hooks/useWindowSize';

// Import the new AttachmentCarouselDialog
import { AttachmentCarouselDialog, AttachmentFileItem } from '@/components/ui/attachment-carousel-dialog';

interface MessageFile {
  url: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

interface UploadData {
  name: string;
  size: number;
  key: string;
  serverData: {
    uploadedBy: string;
    url: string;
  };
  url: string;
  customId: string | null;
  type: string;
}

interface MessageInputAreaProps {
  onSendMessage: (message: string, attachments?: MessageFile[]) => void;
  selectedConversation: any;
  onTyping?: (isTyping: boolean) => void;
  handleFileClick: (file: MessageFile) => void;
}

const DRAFT_EXPIRY_MINUTES = 5;
const RECENTLY_CHANGED_EXPIRY_SECONDS = 10; // Store drafts for 10 seconds after conversation change

const getStorageKey = (conversationId: string) => `message_draft_${conversationId}`;
const getRecentConversationKey = () => 'recent_conversation_change';

interface StoredDraft {
  message: string;
  attachments: MessageFile[];
  timestamp: number;
}

interface RecentConversationChange {
  previousId: string;
  message: string;
  attachments: MessageFile[];
  timestamp: number;
}

const MessageInputArea: React.FC<MessageInputAreaProps> = ({
  onSendMessage,
  selectedConversation,
  onTyping,
  handleFileClick,
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<MessageFile[]>([]);
  const [hasRecentChange, setHasRecentChange] = useState(false);
  const [previousConversationId, setPreviousConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { width } = useWindowSize();
  
  const prevConversationIdRef = useRef<string | null>(null);

  // State for controlling the Attachment Carousel Dialog
  const [isAttachmentCarouselOpen, setIsAttachmentCarouselOpen] = useState(false);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);


  useEffect(() => {
    if (selectedConversation?.id !== prevConversationIdRef.current && prevConversationIdRef.current !== null) {
      setNewMessageInput('');
      setMessageAttachments([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    }
    prevConversationIdRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  const handleSend = () => {
    const hasContent = newMessageInput.trim() || messageAttachments.length > 0;
    if (!hasContent) return;

    const messageContent = newMessageInput.trim();

    if (messageAttachments.length > 0) {
      onSendMessage(messageContent, messageAttachments);
    } else {
      onSendMessage(messageContent);
    }

    setNewMessageInput('');
    setMessageAttachments([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
    
    if (selectedConversation?.id) {
      localStorage.removeItem(getStorageKey(selectedConversation.id));
      
      const recentChangeData = localStorage.getItem(getRecentConversationKey());
      if (recentChangeData) {
        const recentChange: RecentConversationChange = JSON.parse(recentChangeData);
        if (recentChange.previousId === selectedConversation.id) {
          localStorage.removeItem(getRecentConversationKey());
        }
      }
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
    const attachments: MessageFile[] = res.map(r => ({
      url: r.url,
      fileName: r.name,
      fileKey: r.key,
      fileType: r.type,
      fileSize: r.size
    }));
    console.log('Setting message attachments:', attachments);
    setMessageAttachments(prev => [...prev, ...attachments]);
  };

  // Function to open the attachment carousel
  const openAttachmentCarousel = (index: number) => {
    setCarouselInitialIndex(index);
    setIsAttachmentCarouselOpen(true);
  };

  return (
    <div className="pb-1 px-2 bg-transparent overflow-x-hidden">
      {messageAttachments.length > 0 && (<div className=" scrollbar-hide py-1 space-x-2 mb-2 bg-black/15 px-2 rounded">
        {messageAttachments.map((attachment, index) => {
          const handleRemoveAttachment = () => {
            setMessageAttachments(prev => prev.filter((_, i) => i !== index));
          };

          const isImage = isImageFile(attachment.fileName || '');
          const fileObjectForPreview = {
            fileUrl: attachment.url,
            fileKey: attachment.fileKey || attachment.url,
            fileName: attachment.fileName || 'attachment',
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
          };

          return (
            <div key={index} className="inline-block flex-shrink-0 aspect-square rounded group">
              {isImage ? (
                <div className=" relative aspect-square h-[80px] w-[80px] md:h-[100px] md:w-[100px]">
                  <button
                    className="absolute top-0 right-0 z-10 w-5 h-5 bg-white/80 hover:bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveAttachment}
                    aria-label="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                  <Image
                    src={attachment.url}
                    alt={attachment.fileName || "Message Attachment"}
                    width={100}
                    height={100}
                    className="cursor-pointer object-cover aspect-square w-full h-full"
                    onClick={() => openAttachmentCarousel(index)}
                  />
                </div>
              ) : (
                <div className="aspect-square h-[80px] w-[80px] md:h-[100px] md:w-[100px]">
                  <FilePreview
                    file={fileObjectForPreview}
                    previewSize="small"
                    allowPreview={false}
                    allowDownload={false}
                    showRemove={true}
                    onRemove={handleRemoveAttachment}
                    onClick={() => openAttachmentCarousel(index)}
                    className="h-full w-full aspect-square"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
 )}
      
      <div
        className="flex items-center mb-4 bg-white border-gray-300 border focus:outline-none w-full focus:ring-1 focus:ring-black overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          borderRadius: newMessageInput.length > 0 
            ? newMessageInput.length > 20 
              ? newMessageInput.length > 40
                ? newMessageInput.length > 60
                  ? width && width >= 768 ? '1.25rem' : '0.375rem'
                  : width && width >= 768 ? '1.5rem' : '0.5rem'
                : width && width >= 768 ? '2rem' : '0.75rem'
              : width && width >= 768 ? '3rem' : '1.5rem'
            : '9999px'
        }}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 px-5 py-3 focus:outline-none text-black resize-none w-full min-h-[44px] max-h-[132px] overflow-y-hidden leading-relaxed font-jakarta"
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

      {/* Use the new AttachmentCarouselDialog component */}
      {messageAttachments.length > 0 && (
        <AttachmentCarouselDialog
          attachments={messageAttachments as AttachmentFileItem[]}
          isOpen={isAttachmentCarouselOpen}
          onOpenChange={setIsAttachmentCarouselOpen}
          initialIndex={carouselInitialIndex}
        />
      )}
    </div>
  );
};

export default MessageInputArea;

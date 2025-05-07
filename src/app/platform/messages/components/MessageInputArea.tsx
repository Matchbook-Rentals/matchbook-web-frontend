import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, X } from 'lucide-react';
import Image from "next/image";
import { FilePreview } from '@/components/ui/file-preview';
import { isImageFile } from '@/lib/utils';
import { useWindowSize } from '@/hooks/useWindowSize';

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
  handleFileClick
}) => {
  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<MessageFile[]>([]);
  const [hasRecentChange, setHasRecentChange] = useState(false);
  const [previousConversationId, setPreviousConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { width } = useWindowSize();
  
  // Track previous conversation ID
  const prevConversationIdRef = useRef<string | null>(null);

  // Effect to reset input when selected conversation changes
  useEffect(() => {
    if (selectedConversation?.id !== prevConversationIdRef.current && prevConversationIdRef.current !== null) {
      setNewMessageInput('');
      setMessageAttachments([]);
      
      // Reset textarea height to default
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
    
    // Reset textarea height to default
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
    
    // Clean up any saved drafts for this conversation
    if (selectedConversation?.id) {
      localStorage.removeItem(getStorageKey(selectedConversation.id));
      
      // Also clean up recent change data if it exists for this conversation
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
    const attachments = res.map(r => ({
      url: r.url,
      fileName: r.name,
      fileKey: r.key,
      fileType: r.type,
      fileSize: r.size
    }));
    console.log('Setting message attachments:', attachments);
    setMessageAttachments(prev => [...prev, ...attachments]);
  };

  return (
    <div className="py-1 px-12 bg-background">
      {messageAttachments.length > 0 && (<div className="flex overflow-x-auto scrollbar-hide py-1 space-x-2 mb-2 bg-black/20 px-2 rounded">
        {messageAttachments.map((attachment, index) => {
          const handleRemove = () => {
            setMessageAttachments(prev => prev.filter((_, i) => i !== index));
          };

          const isImage = isImageFile(attachment.fileName || '');
          const fileObject = {
            url: attachment.url,
            fileKey: attachment.fileKey || attachment.url,
            fileName: attachment.fileName || 'attachment',
            fileType: attachment.fileType
          };

          return (
            <div key={index} className="inline-block flex-shrink-0 aspect-square rounded">
              {isImage ? (
                <div className="p-1 bg-white relative aspect-square h-[80px] w-[80px] md:h-[100px] md:w-[100px]">
                  <button
                    className="absolute top-0 right-0 z-10 w-5 h-5 bg-white/80 hover:bg-white/90 rounded-full items-center justify-center"
                    onClick={handleRemove}
                  >
                    <X size={12} />
                  </button>
                  <Image
                    src={attachment.url}
                    alt="Message Attachment"
                    width={100}
                    height={100}
                    className="cursor-pointer object-cover aspect-square w-full h-full"
                    onClick={() => handleFileClick(attachment)}
                  />
                </div>
              ) : (
                <div className="aspect-square h-[80px] w-[80px] md:h-[100px] md:w-[100px]">
                  <FilePreview
                    file={fileObject}
                    previewSize="small"
                    allowPreview={false}
                    showRemove={true}
                    onRemove={handleRemove}
                    onClick={() => handleFileClick(attachment)}
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
        className="flex items-center mb-4 bg-white border-gray-300 border focus:outline-none focus:ring-1 focus:ring-black overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          borderRadius: newMessageInput.length > 0 
            ? newMessageInput.length > 20 
              ? newMessageInput.length > 40
                ? newMessageInput.length > 60
                  ? width && width >= 768 ? '1.25rem' : '0.375rem' // Final stage: 1.25rem on desktop, 0.375rem on mobile
                  : width && width >= 768 ? '1.5rem' : '0.5rem'    // Stage 3: gradually reducing
                : width && width >= 768 ? '2rem' : '0.75rem'       // Stage 2: middle transition
              : width && width >= 768 ? '3rem' : '1.5rem'          // Stage 1: starting to round less
            : '9999px'                                             // Default: rounded-full
        }}
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
  );
};

export default MessageInputArea;

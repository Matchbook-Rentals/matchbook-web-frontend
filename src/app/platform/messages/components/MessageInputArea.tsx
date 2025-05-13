import React, { useState, useRef, useEffect } from 'react';
import { UploadButton } from "@/app/utils/uploadthing";
import { PaperclipIcon, X } from 'lucide-react';
import Image from "next/image";
import { FilePreview } from '@/components/ui/file-preview';
import { isImageFile } from '@/lib/utils';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onKeyboardVisibilityChange?: (isVisible: boolean) => void;
  onHeightChange?: (height: number) => void;
}

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
  onKeyboardVisibilityChange,
  onHeightChange,
}) => {
  // Style variables
  const inputAreaClassNames = "flex-1 px-5 py-3 focus:outline-none text-black resize-none w-full min-h-[44px] max-h-[132px] overflow-y-hidden leading-relaxed font-jakarta";
  const inputContainerClassNames = "flex items-center mb-4 bg-white border-gray-300 border focus:outline-none w-full focus:ring-1 focus:ring-black overflow-hidden transition-all duration-300 ease-in-out";
  
  // Track component height for parent coordination
  const componentRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic border radius based on message length and screen width
  const calculateBorderRadius = (messageLength: number, screenWidth: number | undefined) => {
    if (messageLength === 0) return '9999px';

    if (messageLength > 60) {
      return screenWidth && screenWidth >= 768 ? '1.25rem' : '0.375rem';
    } else if (messageLength > 40) {
      return screenWidth && screenWidth >= 768 ? '1.5rem' : '0.5rem';
    } else if (messageLength > 20) {
      return screenWidth && screenWidth >= 768 ? '2rem' : '0.75rem';
    } else {
      return screenWidth && screenWidth >= 768 ? '3rem' : '1.5rem';
    }
  };

  const [newMessageInput, setNewMessageInput] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<MessageFile[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { width, height } = useWindowSize();
  const isMobile = useIsMobile();

  const prevConversationIdRef = useRef<string | null>(null);
  const prevWindowHeight = useRef<number | undefined>(height);

  // State for controlling the Attachment Carousel Dialog
  const [isAttachmentCarouselOpen, setIsAttachmentCarouselOpen] = useState(false);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);


  // Track if upload button is being interacted with
  const [isUploadActive, setIsUploadActive] = useState(false);

  // Remove manual keyboard detection and let dvh handle it
  // Monitor window height changes to detect keyboard visibility
  useEffect(() => {
    if (isMobile && height && prevWindowHeight.current) {
      // If height significantly decreased, keyboard is likely visible
      const heightDifference = prevWindowHeight.current - height;
      const keyboardThreshold = prevWindowHeight.current * 0.15; // 15% threshold
      const keyboardVisible = heightDifference > keyboardThreshold;
      
      if (keyboardVisible !== isKeyboardVisible) {
        setIsKeyboardVisible(keyboardVisible);
        if (onKeyboardVisibilityChange) {
          onKeyboardVisibilityChange(keyboardVisible);
        }
        
        // When keyboard state changes, report current height
        if (componentRef.current && onHeightChange) {
          setTimeout(() => {
            onHeightChange(componentRef.current?.offsetHeight || 0);
          }, 50); // Small delay to let layout settle
        }
      }
    }
    
    prevWindowHeight.current = height;
  }, [height, isMobile, isKeyboardVisible, onKeyboardVisibilityChange, onHeightChange]);

  // Simpler focus/blur handling that doesn't try to override the height detection
  useEffect(() => {
    const handleFocus = () => {
      if (isMobile) {
        // Focus always suggests keyboard is about to appear
        setIsKeyboardVisible(true);
        if (onKeyboardVisibilityChange) {
          onKeyboardVisibilityChange(true);
        }
      }
    };

    // On modern browsers/devices, we can rely on the window height detection
    // This is just a backup for older devices
    const handleBlur = () => {
      if (isMobile) {
        // Small delay to let height measurements settle
        setTimeout(() => {
          // Don't override height-based detection if it thinks keyboard is still visible
          if (height && prevWindowHeight.current) {
            const heightDifference = prevWindowHeight.current - height;
            const keyboardStillVisible = heightDifference > (prevWindowHeight.current * 0.1);
            
            // Only update if height indicates keyboard is actually gone
            if (!keyboardStillVisible) {
              setIsKeyboardVisible(false);
              if (onKeyboardVisibilityChange) {
                onKeyboardVisibilityChange(false);
              }
            }
          } 
        }, 100);
      }
    };

    if (textareaRef.current) {
      textareaRef.current.addEventListener('focus', handleFocus);
      textareaRef.current.addEventListener('blur', handleBlur);
    }

    return () => {
      if (textareaRef.current) {
        textareaRef.current.removeEventListener('focus', handleFocus);
        textareaRef.current.removeEventListener('blur', handleBlur);
      }
    };
  }, [isMobile, height, onKeyboardVisibilityChange]);

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
  
  // Track component height and report it to parent if needed
  useEffect(() => {
    const reportHeight = () => {
      if (componentRef.current && onHeightChange) {
        const height = componentRef.current.offsetHeight;
        onHeightChange(height);
      }
    };
    
    // Report on initial render
    reportHeight();
    
    // Create observer to track size changes
    if (componentRef.current && onHeightChange) {
      const resizeObserver = new ResizeObserver(() => {
        reportHeight();
      });
      
      resizeObserver.observe(componentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onHeightChange, messageAttachments.length, newMessageInput.length]);

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
    <div
      ref={componentRef}
      className={`${isMobile ? 'sticky bottom-0 z-30 bg-background transition-all duration-300 pr-4' : 'relative pr-0 pb-1 md:pl-4 bg-transparent'} overflow-x-hidden`}
      style={{
        paddingBottom: isMobile ? '8px' : undefined,
      }}
    >
      {messageAttachments.length > 0 && (
        <div className="scrollbar-hide py-1 space-x-2 mb-2 bg-black/15 px-2 rounded">
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
                  <div className="relative aspect-square h-[80px] w-[80px] md:h-[100px] md:w-[100px]">
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
        ref={inputContainerRef}
        className={`${inputContainerClassNames} ${isMobile ? 'mx-2' : ''}`}
        style={{
          borderRadius: calculateBorderRadius(newMessageInput.length, width)
        }}
      >
        <textarea
          ref={textareaRef}
          className={inputAreaClassNames}
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
          <div 
            className={`p-2 ${!selectedConversation ? "opacity-50 pointer-events-none" : ""}`}
            onTouchStart={() => setIsUploadActive(true)}
            onTouchEnd={() => setTimeout(() => setIsUploadActive(false), 500)}
            onMouseDown={() => setIsUploadActive(true)}
            onMouseUp={() => setTimeout(() => setIsUploadActive(false), 500)}
          >
            <UploadButton
              endpoint="messageUploader"
              onClientUploadComplete={(res) => {
                handleUploadFinish(res);
                setIsUploadActive(false);
              }}
              onUploadError={(error) => {
                alert(error.message);
                setIsUploadActive(false);
              }}
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

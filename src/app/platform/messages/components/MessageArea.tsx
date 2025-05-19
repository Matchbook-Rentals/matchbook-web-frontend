import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilePreview } from '@/components/ui/file-preview';
import { isImageFile } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import MessageList from './MessageList';
import MessageInputArea from './MessageInputArea';
import ConversationHeader from './ConversationHeader';

interface MessageAreaProps {
  selectedConversation: any;
  messages: any[];
  onSendMessage: (message: string, attachments?: MessageFile[]) => void;
  currentUserId: string | undefined;
  currentUserImage?: string | null;
  onBack?: () => void;
  onTyping?: (isTyping: boolean) => void;
  isOtherUserTyping?: boolean;
  initialIsMobile?: boolean;
}

interface MessageFile {
  url: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

// Add VisualViewport type if not available
declare global {
  interface Window {
    visualViewport?: VisualViewport;
  }
}

const MessageArea: React.FC<MessageAreaProps> = ({
  selectedConversation,
  messages,
  onSendMessage,
  currentUserId,
  currentUserImage = "/placeholder-avatar.png",
  onBack,
  onTyping,
  isOtherUserTyping = false,
  initialIsMobile = false
}) => {
  const [selectedFile, setSelectedFile] = useState<MessageFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);
  const [initialHeight] = useState<number>(window.innerHeight); // Store initial height
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [scrollAreaHeight, setScrollAreaHeight] = useState<string>('100%');
  
  // Detect if device is iOS
  const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

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

  // Handle visual viewport changes for keyboard management
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const newHeight = window.visualViewport.height;
        setViewportHeight(newHeight);
      }
    };

    // Initial setup
    handleViewportChange();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isMobile]);

  // Calculate scroll area height dynamically
  useEffect(() => {
    const calculateScrollAreaHeight = () => {
      if (!isMobile || !headerRef.current || !inputRef.current) {
        setScrollAreaHeight('100%');
        return;
      }

      const headerHeight = headerRef.current.offsetHeight;
      const inputHeight = inputRef.current.offsetHeight;
      const availableHeight = viewportHeight - headerHeight - inputHeight;
      
      setScrollAreaHeight(`${availableHeight}px`);
    };

    calculateScrollAreaHeight();
    
    // Recalculate on viewport or content changes
    const resizeObserver = new ResizeObserver(calculateScrollAreaHeight);
    
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (inputRef.current) resizeObserver.observe(inputRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isMobile, viewportHeight]);

  useEffect(() => {
    if (selectedConversation) {
      setIsExiting(false);
      
      // Force focus on the scroll area when conversation changes
      if (isIOS() && isMobile) {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport instanceof HTMLElement) {
              scrollViewport.focus();
              // Also blur any previously focused elements
              const activeElement = document.activeElement;
              if (activeElement && activeElement instanceof HTMLElement) {
                activeElement.blur();
              }
              scrollViewport.focus();
            }
          }
        }, 200);
      }
    }
  }, [selectedConversation, isMobile]);

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
  
  // Track last scroll position and direction
  const lastScrollTopRef = useRef(0);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    
    const handleScroll = () => {
      if (scrollContainer) {
        const currentScrollTop = scrollContainer.scrollTop;
        const scrollDifference = lastScrollTopRef.current - currentScrollTop;
        
        // If scrolling up more than 40px, blur the input to close keyboard
        if (scrollDifference > 20 && isMobile) {
          if (messageInputRef.current) {
            messageInputRef.current.blur();
          }
        }
        
        lastScrollTopRef.current = currentScrollTop;
      }
    };
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isMobile]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-scroll to bottom and focus scroll area on component mount
  useEffect(() => {
    scrollToBottom();
    
    // Focus the scroll area to enable scrolling without needing a click first
    if (scrollAreaRef.current) {
      // Use setTimeout to ensure the focus happens after the component is fully rendered
      setTimeout(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport instanceof HTMLElement) {
          scrollViewport.focus();
          
          // On iOS, also try to prevent parent scroll by setting overflow on body
          if (isIOS() && isMobile) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
          }
        }
      }, 100);
    }
    
    // Cleanup function to restore body scroll
    return () => {
      if (isIOS() && isMobile) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [isMobile]);

  const handleFileClick = (file: MessageFile) => {
    // Only open the dialog if the file is an image
    if (file.fileName && isImageFile(file.fileName)) {
      setSelectedFile(file);
    }
    // For non-image files, clicking does nothing in terms of opening the dialog.
    // Download functionality is handled separately by the FilePreview component itself if needed.
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

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFullSizeFile = () => {
    if (!selectedFile) return null;

    const fileObject = {
      url: selectedFile.url,
      fileKey: selectedFile.fileKey || selectedFile.url,
      fileName: selectedFile.fileName || 'attachment',
      fileType: selectedFile.fileType,
    };

    if (isImageFile(selectedFile.fileName || '')) {
      return (
        <div className="flex flex-col items-center">
          <Image
            src={selectedFile.url}
            alt="Enlarged Image"
            width={800}
            height={800}
            className="max-h-[70vh] w-auto object-contain"
            priority
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => downloadFile(selectedFile.url, selectedFile.fileName || 'image')}
          >
            <Download size={14} className="mr-2" />
            Download
          </Button>
        </div>
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

  const messageContainerClassName = `flex flex-col box-border no-wrap${
    isMobile
      ? ' w-full overflow-hidden fixed top-0 left-0'
      : ' h-[calc(100dvh-65px)] sm:h-[calc(100dvh-65px)] md:h-[calc(100dvh-80px)]'
  } bg-background w-full ${
    isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''
  } ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

  // On iOS, use initial height to prevent extra space when keyboard appears
  const containerStyle = isMobile ? { height: `${isIOS() ? initialHeight : viewportHeight}px` } : {};

  return (
    <div 
      ref={containerRef}
      className={messageContainerClassName}
      style={containerStyle}>
      <div ref={headerRef} className="flex-shrink-0">
        <ConversationHeader
          selectedConversation={selectedConversation}
          participantInfo={participantInfo}
          onBack={onBack}
          isMobile={isMobile}
          handleBackClick={handleBackClick}
        />
      </div>

      <div className="flex-1 w-full overflow-hidden" style={isMobile ? { height: scrollAreaHeight } : {}}>
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full w-[101%] md:w-[100.7%] overflow-x-visible" 
          tabIndex={0}
          onTouchStart={() => {
            // Ensure focus on touch for iOS
            if (isIOS() && isMobile && scrollAreaRef.current) {
              const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
              if (scrollViewport instanceof HTMLElement) {
                scrollViewport.focus();
              }
            }
          }}
        >
          <div className="py-2 px-4 min-h-full md:pb-2">
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              selectedConversation={selectedConversation}
              participantInfo={participantInfo}
              isOtherUserTyping={isOtherUserTyping}
              handleFileClick={handleFileClick}
            />
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      <div ref={inputRef} className="flex-shrink-0">
        <MessageInputArea
          onSendMessage={onSendMessage}
          selectedConversation={selectedConversation}
          onTyping={onTyping}
          handleFileClick={handleFileClick}
          textareaRef={messageInputRef}
        />
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

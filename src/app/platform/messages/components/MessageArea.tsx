import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilePreview } from '@/components/ui/file-preview';
import { isImageFile } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(60); // Default input area height
  const [headerHeight, setHeaderHeight] = useState(60); // Default header height
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { height } = useWindowSize();


  useEffect(() => {
    if (selectedConversation) {
      setIsExiting(false);
    }
  }, [selectedConversation]);
  
  // Measure header height with resize observer to keep it accurate
  useEffect(() => {
    if (headerRef.current) {
      const updateHeaderHeight = () => {
        const height = headerRef.current?.offsetHeight || 0;
        setHeaderHeight(height);
      };
      
      // Initial measurement
      updateHeaderHeight();
      
      // Create resize observer to track size changes
      const resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      
      resizeObserver.observe(headerRef.current);
      return () => resizeObserver.disconnect();
    }
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
  
  // Also scroll to bottom when keyboard visibility changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 200);

    return () => clearTimeout(timer);
  }, [isKeyboardVisible]);

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

  // Simpler class-based container - let it fill its parent naturally
  const messageContainerClassName = `flex flex-col h-full w-full bg-background overflow-hidden ${
    isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''
  } ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

  return (
    <div className={messageContainerClassName}>
      <div ref={headerRef} className="">
        <ConversationHeader
          selectedConversation={selectedConversation}
          participantInfo={participantInfo}
          onBack={onBack}
          isMobile={isMobile}
          handleBackClick={handleBackClick}
        />
      </div>

      <div className="flex-1 w-full overflow-x-hidden">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="w-[101%] md:w-[100.7%] overflow-x-visible h-full"
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

      <div className={''}>
        <MessageInputArea
          onSendMessage={onSendMessage}
          selectedConversation={selectedConversation}
          onTyping={onTyping}
          handleFileClick={handleFileClick}
          onKeyboardVisibilityChange={setIsKeyboardVisible}
          onHeightChange={setInputHeight}
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

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
  const [isInputFocused, setIsInputFocused] = useState(false);

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
    if (selectedConversation) {
      setIsExiting(false);
    }
  }, [selectedConversation]);

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
  
  // Handle input focus changes
  const handleInputFocus = (isFocused: boolean) => {
    setIsInputFocused(isFocused);
    if (isFocused) {
      // Scroll to bottom immediately when input is focused
      setTimeout(scrollToBottom, 0);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);
  
  // Effect to scroll to bottom when input gets focused
  useEffect(() => {
    if (isInputFocused) {
      scrollToBottom();
    }
  }, [isInputFocused]);

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

  const messageContainerClassName = `flex flex-col box-border  no-wrap${
    isMobile
      ? ' w-full h-[100dvh] overflow-hidden'
      : 'h-[calc(100dvh-65px)] sm:h-[calc(100dvh-65px)] md:h-[calc(100dvh-80px)]'
  } bg-background w-full ${
    isMobile ? 'transform transition-transform duration-300 ease-in-out' : ''
  } ${isMobile && isExiting ? 'translate-x-full' : 'translate-x-0'}`;

  return (
    <div className={messageContainerClassName}>
      <div className="">
        <ConversationHeader
          selectedConversation={selectedConversation}
          participantInfo={participantInfo}
          onBack={onBack}
          isMobile={isMobile}
          handleBackClick={handleBackClick}
        />
      </div>

      <div className="flex-1 w-full overflow-x-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full w-[101%] md:w-[100.7%] overflow-x-visible">
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
          onInputFocus={handleInputFocus}
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

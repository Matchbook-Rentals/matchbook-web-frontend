import React, { useState } from 'react';
import { File, Download } from 'lucide-react';
import Image from "next/image";
import { isImageFile } from '@/lib/utils';
import { FilePreview } from '@/components/ui/file-preview';
import { AttachmentCarouselDialog } from '@/components/ui/attachment-carousel-dialog';

interface MessageFile {
  url: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

interface MessageListProps {
  messages: any[];
  currentUserId: string | undefined;
  selectedConversation: any;
  participantInfo: { displayName: string; imageUrl: string };
  isOtherUserTyping?: boolean;
  handleFileClick: (file: MessageFile) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  selectedConversation,
  participantInfo,
  isOtherUserTyping = false,
  handleFileClick
}) => {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselAttachments, setCarouselAttachments] = useState<MessageFile[]>([]);
  const [initialCarouselIndex, setInitialCarouselIndex] = useState(0);
  
  const openAttachmentCarousel = (attachments: MessageFile[], index: number) => {
    setCarouselAttachments(attachments);
    setInitialCarouselIndex(index);
    setIsCarouselOpen(true);
  };
  const renderFileAttachment = (url: string, fileName: string = 'attachment', fileKey?: string, fileType?: string, isGridItem?: boolean) => {
    const fileObject = {
      url,
      fileName,
      fileKey,
      fileType
    };

    if (isImageFile(fileName)) {
      if (isGridItem) {
        return (
          <Image
            src={url}
            alt="Message Attachment"
            layout="fill"
            objectFit="cover"
            className="cursor-pointer"
            onClick={() => handleFileClick(fileObject)}
          />
        );
      } else {
        return (
          <Image
            src={url}
            alt="Message Attachment"
            width={250}
            height={250}
            className="rounded cursor-pointer"
            onClick={() => handleFileClick(fileObject)}
          />
        );
      }
    }

    // For non-image files:
    if (isGridItem) {
      // Custom compact rendering for non-image files in a grid
      return (
        <div
          className="flex h-full flex-col items-center border justify-center px-2 rounded cursor-pointer"
          onClick={() => handleFileClick(fileObject)}
          title={fileName} // Show full filename on hover
        >
          <File className="" />
          <p className="text-sm truncate w-full text-center mt-2">
            {fileName}
          </p>
          <button
            className="mt-4 flex space-x-2 border p-2 hover:underline items-center"
            onClick={() => downloadFile(fileObject.url, fileObject.fileName || 'image')}
          >
            <Download size={14} className="mr-2" />
            Download
          </button>
        </div>
      );
    } else {
      // Default rendering for non-image files not in a grid
      return (
        <FilePreview
          file={{
            url,
            fileKey: fileKey || url,
            fileName,
            fileType
          }}
          previewSize="small"
          allowPreview={false}
          onClick={() => handleFileClick(fileObject)}
        />
      );
    }
  };

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Group consecutive messages by sender and content type
  const messageGroups: any[][] = [];
  let currentGroup: any[] = [];

  // Helper function to determine message type
  const getMessageType = (message: any): string => {
    const hasTextContent = message.content && message.content.trim().length > 0;
    // Check if message has attachments
    if (message.attachments && message.attachments.length > 0) {
      // If there's text content with attachments, treat as a captioned attachment
      if (hasTextContent) return 'captioned_attachment';
      
      // Check if all attachments are images
      const allAttachmentsAreImages = message.attachments.every((attachment: MessageFile) => 
        attachment.fileName ? isImageFile(attachment.fileName) : false
      );
      
      if (allAttachmentsAreImages) return 'image';
      return 'file';
    }
    
    // Text-only message
    return 'text';
  };

  messages.forEach((message, index) => {
    // Get message type for current message
    const currentMessageType = getMessageType(message);
    
    // Start a new group if:
    // 1. It's the first message.
    // 2. The sender is different from the previous message.
    // 3. The current message type is different from the previous message type.
    // 4. The current message is a captioned attachment (always gets its own group).
    const startNewGroup = index === 0 ||
                          message.senderId !== messages[index - 1].senderId ||
                          currentMessageType !== getMessageType(messages[index - 1]) ||
                          currentMessageType === 'captioned_attachment';

    if (startNewGroup) {
      // Start of a new group
      if (currentGroup.length > 0) {
        messageGroups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      // Continue the current group
      currentGroup.push(message);
    }
  });

  // Push the last group
  if (currentGroup.length > 0) {
    messageGroups.push(currentGroup);
  }

  const renderGroupStatus = (group: any[], isCurrentUserGroup: boolean) => {
    const lastMessage = group[group.length - 1];

    // If the message is still pending (sending)
    if (lastMessage.pending) {
      return <span className="text-xs text-gray-400">Sending...</span>;
    } 
    // If the message failed to send
    if (lastMessage.failed) {
      return <span className="text-xs text-red-500">Failed to send</span>;
    }

    // Check status only for the current user's messages
    if (isCurrentUserGroup) {
      // If the last message in the group has been read
      if (lastMessage.isRead && lastMessage.updatedAt) {
        const date = new Date(lastMessage.updatedAt);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);
        let formattedTime: string;

        if (hours < 24) {
          // If less than 24 hours ago, show time
          formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else {
          // If more than 24 hours ago, show date
          formattedTime = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }
        return <span className="text-xs text-gray-400">{`Read ${formattedTime}`}</span>;
      }

      // If the last message has a delivery status from the server
      if (lastMessage.deliveryStatus === 'delivered') {
        const deliveredTime = lastMessage.deliveredAt ?
          new Date(lastMessage.deliveredAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        return <span className="text-xs text-gray-400">{deliveredTime ? `Delivered ${deliveredTime}` : "Delivered"}</span>;
      }

      // Default status for sent messages (last one in the group)
      return <span className="text-xs text-gray-400">Sent</span>;
    }

    return null; // No status for the other user's messages
  };

  return (
    <div className='w-full'>
      <AttachmentCarouselDialog 
        attachments={carouselAttachments}
        isOpen={isCarouselOpen}
        onOpenChange={setIsCarouselOpen}
        initialIndex={initialCarouselIndex}
        withDownloadButton={true}
      />
      {messageGroups.map((group, groupIndex) => {
        const firstMessage = group[0];
        const isCurrentUserGroup = firstMessage.senderId === currentUserId;
        const justifyClass = isCurrentUserGroup ? 'justify-end' : 'justify-start';
        const showAvatar = !isCurrentUserGroup; // Show avatar only for the other user's group
        
        const bubbleStyles = isCurrentUserGroup
          ? 'bg-gray-700 text-white border-white/10 pl-5 pr-5 font-normal rounded-br-none'
          : 'bg-gray-100 text-black pr-5 pl-5 rounded-bl-none text-wrap font-normal border-gray-200';

        return (
          <div key={`group-${groupIndex}`} className="mb-3 pr-1 md:pr-3">
            <div className={`flex ${justifyClass}`}>
              {showAvatar && (
                <div className="relative self-end">
                  <img
                    src={participantInfo.imageUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full mr-2"
                  />
                </div>
              )}
              <div className={`max-w-[70%] text-black rounded-2xl border leading-snug shadow-md py-2 overflow-hidden overflow-wrap-anywhere ${bubbleStyles}`}>
                {(() => {
                  // Get regular text messages (with no attachments)
                  const textMessages = group.filter(msg => 
                    getMessageType(msg) === 'text'
                  );

                  // Get captioned attachment messages
                  const captionedAttachmentMessages = group.filter(msg => 
                    getMessageType(msg) === 'captioned_attachment'
                  );

                  // Get messages with image attachments only (no caption)
                  const imageOnlyMessages = group.filter(msg => 
                    getMessageType(msg) === 'image'
                  );

                  // Get messages with file attachments only (no caption)
                  const fileOnlyMessages = group.filter(msg => 
                    getMessageType(msg) === 'file'
                  );

                  // Then collect all image attachments across all image-only messages in this group
                  const allImageAttachments: {attachment: MessageFile, messageId: string | number}[] = [];
                  imageOnlyMessages.forEach(msg => {
                    if (msg.attachments && msg.attachments.length > 0) {
                      const imageAttachments = msg.attachments.filter((att: MessageFile) => 
                        att.fileName ? isImageFile(att.fileName) : false
                      );
                      imageAttachments.forEach((att: MessageFile) => {
                        allImageAttachments.push({
                          attachment: att,
                          messageId: msg.id || `msg-${group.indexOf(msg)}`
                        });
                      });
                    }
                  });

                  return (
                    <>
                      {/* Render text messages */}
                      {textMessages.map((message, messageIndex) => (
                        <div 
                          key={message.id || `text-msg-${messageIndex}`}
                          className={`${messageIndex > 0 ? 'pt-1.5 border-gray-500/30' : ''} px-0 py-0`}
                        >
                          <p className="whitespace-pre-wrap break-words px-0 py-0 overflow-hidden overflow-wrap-anywhere">
                            {message.content}
                          </p>
                        </div>
                      ))}

                      {/* Render image grid */}
                      {allImageAttachments.length > 0 && (
                        <div className={`${textMessages.length > 0 ? 'mt-2' : 'mt-0'}`}>
                          <div className={`grid ${allImageAttachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                            {allImageAttachments.map((item, index) => (
                              <div 
                                key={`${item.messageId}-img-${index}`} 
                                className="aspect-square h-[150px] relative overflow-hidden rounded cursor-pointer"
                                onClick={() => openAttachmentCarousel(
                                  allImageAttachments.map(i => i.attachment), 
                                  index
                                )}
                              >
                                <Image
                                  src={item.attachment.url}
                                  alt="Message Attachment"
                                  layout="fill"
                                  objectFit="cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Render file attachments */}
                      {fileOnlyMessages.map((message, messageIndex) => {
                        const nonImageAttachments = message.attachments.filter((att: MessageFile) => 
                          att.fileName ? !isImageFile(att.fileName) : true
                        );
                        
                        return (
                          <div 
                            key={message.id || `file-msg-${messageIndex}`}
                            className={`${(textMessages.length > 0 || allImageAttachments.length > 0 || messageIndex > 0) ? 'mt-2' : 'mt-0'}`}
                          >
                            {nonImageAttachments.map((attachment: MessageFile, attIndex: number) => (
                              <div key={`${message.id}-file-${attIndex}`} className="max-w-xs mx-auto mb-2">
                                {renderFileAttachment(attachment.url, attachment.fileName, attachment.fileKey, attachment.fileType, false)}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {/* Render captioned attachment messages */}
                      {captionedAttachmentMessages.map((message, messageIndex) => {
                        const isImagesOnly = message.attachments.every((att: MessageFile) => 
                          att.fileName ? isImageFile(att.fileName) : false
                        );
                        
                        return (
                          <div 
                            key={message.id || `captioned-msg-${messageIndex}`}
                            className={`${messageIndex > 0 || textMessages.length > 0 || allImageAttachments.length > 0 || fileOnlyMessages.length > 0 ? 'mt-3' : 'mt-0'}`}
                          >
                            {/* Render attachments first */}
                            {isImagesOnly ? (
                              <div className="mb-2">
                                <div className={`grid ${message.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                                  {message.attachments.map((attachment: MessageFile, attIndex: number) => (
                                    <div 
                                      key={`${message.id}-captioned-img-${attIndex}`} 
                                      className="aspect-square h-[150px] relative overflow-hidden rounded cursor-pointer"
                                      onClick={() => openAttachmentCarousel(message.attachments, attIndex)}
                                    >
                                      <Image
                                        src={attachment.url}
                                        alt="Message Attachment"
                                        layout="fill"
                                        objectFit="cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mb-2">
                                {message.attachments.map((attachment: MessageFile, attIndex: number) => (
                                  <div key={`${message.id}-file-${attIndex}`} className="max-w-xs mx-auto mb-2">
                                    {renderFileAttachment(attachment.url, attachment.fileName, attachment.fileKey, attachment.fileType, false)}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Render caption text */}
                            <p className="whitespace-pre-wrap break-words px-0 py-0 overflow-hidden overflow-wrap-anywhere">
                              {message.content}
                            </p>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {isCurrentUserGroup && renderGroupStatus(group, isCurrentUserGroup) && (
              <div className={`flex ${justifyClass} mt-1`}>
                <div className="text-right mr-1">
                  {renderGroupStatus(group, isCurrentUserGroup)}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
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
    </div>
  );
};

export default MessageList;

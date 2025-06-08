'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { sendHostMessage } from '@/app/actions/messages';
import { findConversationBetweenUsers } from '@/app/actions/conversations';

interface MessageGuestDialogProps {
  listingId: string;
  guestName: string;
  guestUserId: string;
  className?: string;
  children?: React.ReactNode;
}

const MessageGuestDialog: React.FC<MessageGuestDialogProps> = ({ 
  listingId, 
  guestName, 
  guestUserId,
  className,
  children 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkConversation = async () => {
      setIsLoading(true);
      try {
        const result = await findConversationBetweenUsers(listingId, guestUserId);
        setExistingConversationId(result.conversationId);
      } catch (error) {
        console.error("Failed to check for existing conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConversation();
  }, [listingId, guestUserId]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot send empty message",
      });
      return;
    }
    setIsSending(true);
    try {
      const result = await sendHostMessage(listingId, guestUserId, message);
      if (result.success) {
        toast({
          title: "Message Sent!",
          description: `Your message has been sent to ${guestName}.`,
        });
        setMessage('');
        setIsOpen(false);
        setExistingConversationId(result.conversationId);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send message",
          description: result.error || "An unknown error occurred.",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while sending the message.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleViewMessagesClick = () => {
    if (existingConversationId) {
      // Check if we already have view=host parameter or are on host side
      const currentView = searchParams.get('view');
      const isHostPath = window.location.pathname.startsWith('/platform/host-dashboard') || 
                        window.location.pathname.startsWith('/platform/host/');
      
      if (currentView === 'host' || isHostPath) {
        router.push(`/platform/messages/?convo=${existingConversationId}&view=host`);
      } else {
        router.push(`/platform/messages/?convo=${existingConversationId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <Button variant='outline' className={className} disabled>
        Checking for messages
      </Button>
    );
  }

  if (existingConversationId) {
    return (
      <Button variant='outline' className={className} onClick={handleViewMessagesClick}>
        View Messages
      </Button>
    );
  }

  // Only render the Dialog if no conversation exists
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant='outline' className={className}>
            Message Guest
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='text-center'>Message {guestName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-4"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-end space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-1/4 bg-gray-200">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()}
            className="w-1/4"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageGuestDialog;
'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter
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
import { sendInitialMessage } from '@/app/actions/messages'; // Adjust path if necessary
import { findConversationByListingAndUser } from '@/app/actions/conversations'; // Import the new action

interface SearchMessageHostDialogProps {
  listingId: string;
  hostName: string;
  // Remove trigger prop if the button is now always rendered inside
}

const SearchMessageHostDialog: React.FC<SearchMessageHostDialogProps> = ({ listingId, hostName }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Control dialog open state
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const checkConversation = async () => {
      setIsLoading(true);
      try {
        const result = await findConversationByListingAndUser(listingId);
        setExistingConversationId(result.conversationId);
      } catch (error) {
        console.error("Failed to check for existing conversation:", error);
        // Optionally show a toast or handle error state
      } finally {
        setIsLoading(false);
      }
    };

    checkConversation();
  }, [listingId]); // Re-run if listingId changes

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
      const result = await sendInitialMessage(listingId, message);
      if (result.success) {

        toast({
          title: "Message Sent!",
          description: `Your message has been sent to ${hostName}.`,
        });
        setMessage(''); // Clear message input on success
        setIsOpen(false); // Close the dialog on success
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
      router.push(`/app/messages/?convo=${existingConversationId}`);
    }
  };

  if (isLoading) {
    return (
      <Button variant='outline' className='w-full mt-1 border-[#3c8787] text-[#3c8787] font-semibold' disabled>
        Checking for messages
      </Button>
    );
  }

  if (existingConversationId) {
    return (
      <Button variant='outline' className='w-full mt-1 border-[#3c8787] text-[#3c8787] font-semibold hover:bg-[#3c8787] hover:text-white transition-colors' onClick={handleViewMessagesClick}>
        View Messages
      </Button>
    );
  }

  // Only render the Dialog if no conversation exists
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full mt-1 border-[#3c8787] text-[#3c8787] font-semibold hover:bg-[#3c8787] hover:text-white transition-colors'>
          Message Host
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='text-center'>Message {hostName}</DialogTitle>
          {/* Optional: Add DialogDescription if needed */}
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
        {/* Note: Using the footer style from the provided JSX */}
        <DialogFooter className="flex flex-row justify-end space-x-2">
          <DialogClose asChild>
            {/* Note: Using the button style from the provided JSX */}
            <Button type="button" variant="secondary" className="w-1/4 bg-gray-200">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()} // Disable if sending or message is empty/whitespace
            className="w-1/4"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SearchMessageHostDialog;

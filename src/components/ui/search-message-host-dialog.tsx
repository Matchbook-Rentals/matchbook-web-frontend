'use client';

import React, { useState } from 'react';
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

interface SearchMessageHostDialogProps {
  listingId: string;
  hostName: string;
  trigger: React.ReactNode; // The element that opens the dialog
}

const SearchMessageHostDialog: React.FC<SearchMessageHostDialogProps> = ({ listingId, hostName, trigger }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Control dialog open state
  const { toast } = useToast();

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Message {hostName}</DialogTitle>
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
            type="button"
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

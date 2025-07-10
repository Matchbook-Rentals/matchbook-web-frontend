'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { findConversationBetweenUsers } from '@/app/actions/conversations';
import { createListingConversation } from '@/app/actions/conversations';

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
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMessageClick = async () => {
    setIsNavigating(true);
    
    try {
      // First, check if conversation exists
      const result = await findConversationBetweenUsers(listingId, guestUserId);
      let conversationId = result.conversationId;
      
      // If no conversation exists, create one
      if (!conversationId) {
        const createResult = await createListingConversation(listingId, guestUserId);
        if (createResult.success && createResult.conversationId) {
          conversationId = createResult.conversationId;
        } else {
          throw new Error(createResult.error || 'Failed to create conversation');
        }
      }
      
      // Navigate to messages page with conversation ID
      const currentView = searchParams.get('view');
      const isHostPath = window.location.pathname.startsWith('/app/host/');
      
      if (currentView === 'host' || isHostPath) {
        router.push(`/app/messages/?convo=${conversationId}&view=host`);
      } else {
        router.push(`/app/messages/?convo=${conversationId}`);
      }
    } catch (error) {
      console.error('Error handling message navigation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open messages. Please try again.",
      });
      setIsNavigating(false);
    }
  };

  return (
    <Button 
      variant='outline' 
      className={className} 
      onClick={handleMessageClick}
      disabled={isNavigating}
    >
      {children || (isNavigating ? 'Opening...' : 'Message Guest')}
    </Button>
  );
};

export default MessageGuestDialog;
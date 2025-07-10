'use client'

import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';

interface DocumentEmbedProps {
  sessionId: string;
  matchOrHouseReqId: string;
  documentId: string;
  handleComplete: (...args: any[]) => void;
  handleLoad?: () => void;
}

const DocumentEmbed: React.FC<DocumentEmbedProps> = ({ 
  sessionId, 
  matchOrHouseReqId,
  documentId, 
  handleComplete, 
  handleLoad 
}) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'session_view.document.loaded':
          console.log('Session view is loaded');
          handleLoad?.();
          break;
        case 'session_view.document.completed':
          console.log('Document is completed');
          handleComplete(documentId, matchOrHouseReqId);
          console.log(payload);
          break;
        case 'session_view.document.exception':
          console.log('Exception during document finalization');
          console.log(payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [documentId, matchOrHouseReqId, handleComplete, handleLoad]);

  return (
    <>
      <Button> CREATE LEASE </Button>
      <iframe
        className='w-[800px] h-[800px]'
        src={`https://app.pandadoc.com/s/${sessionId}/`}
      />
    </>
  );
};

export default DocumentEmbed;

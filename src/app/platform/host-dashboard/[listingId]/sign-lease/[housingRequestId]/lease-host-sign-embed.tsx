'use client'

import { createInitialLease, createLease } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';

interface DocumentEmbedProps {
  sessionId: string;
  housingRequestId: string;
  documentId: string;
}

const DocumentEmbed: React.FC<DocumentEmbedProps> = ({ sessionId, housingRequestId, documentId }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'session_view.document.loaded':
          console.log('Session view is loaded');
          break;
        case 'session_view.document.completed':
          console.log('Document is completed');
          createLease(documentId, housingRequestId)
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
  }, []);

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

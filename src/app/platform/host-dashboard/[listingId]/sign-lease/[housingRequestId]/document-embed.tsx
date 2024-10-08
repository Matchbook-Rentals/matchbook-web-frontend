
'use client'

import React, { useEffect } from 'react';

interface DocumentEmbedProps {
  sessionId: string;
}

const DocumentEmbed: React.FC<DocumentEmbedProps> = ({ sessionId }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'session_view.document.loaded':
          console.log('Session view is loaded');
          break;
        case 'session_view.document.completed':
          console.log('Document is completed');
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
    <iframe 
      className='w-[800px] h-[800px]' 
      src={`https://app.pandadoc.com/s/${sessionId}/`}
    />
  );
};

export default DocumentEmbed;

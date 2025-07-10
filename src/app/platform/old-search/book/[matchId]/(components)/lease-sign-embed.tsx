import React, { useEffect } from 'react';
import { updateBoldSignLease } from '@/app/actions/documents';

interface LeaseSignEmbedProps {
  embeddedSigningLink: string;
  isLeaseSigned: boolean;
  setIsLeaseSigned: (isLeaseSigned: boolean) => void;
}

const LeaseSignEmbed: React.FC<LeaseSignEmbedProps> = ({ embeddedSigningLink, isLeaseSigned, setIsLeaseSigned }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://app.boldsign.com") {
        return;
      }

      switch (event.data.action) {
        case "onDocumentSigned":
          console.log("Document signed successfully");
          setIsLeaseSigned(true);
          updateBoldSignLease(event.data.documentId, { tenantSigned: true });
          break;
        case "onDocumentSigningFailed":
          console.error("Document signing failed");
          // Handle document signing failure
          break;
        case "onDocumentReassigned":
          console.log("Document reassigned successfully");
          // Handle document reassigning success
          break;
        case "onDocumentReassigningFailed":
          console.error("Document reassigning failed");
          // Handle document reassigning failure
          break;
        case "onDocumentDeclined":
          console.log("Document declined successfully");
          // Handle document declining success
          break;
        case "onDocumentDecliningFailed":
          console.error("Document declining failed");
          // Handle document declining failure
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src={embeddedSigningLink}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Lease Signing"
      />
    </div>
  );
};

export default LeaseSignEmbed;

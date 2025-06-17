import { LeaseDocumentEditor } from './lease-document-editor';

interface LeaseDocumentPageProps {
  params: {
    listingId: string;
    housingRequestId: string;
    documentId: string;
  };
}

export default function LeaseDocumentPage({ params }: LeaseDocumentPageProps) {
  return (
    <LeaseDocumentEditor
      listingId={params.listingId}
      housingRequestId={params.housingRequestId}
      documentId={params.documentId}
    />
  );
}
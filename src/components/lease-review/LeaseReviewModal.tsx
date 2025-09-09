'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { PDFViewerWithFields } from '@/components/pdf-editor/PDFViewerWithFields';
import { FieldFormType } from '@/components/pdf-editor/types';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';
import { useToast } from '@/components/ui/use-toast';

interface LeaseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentPdfFile?: File;
  documentFields?: FieldFormType[];
  documentRecipients?: Recipient[];
  listingAddress?: string;
}

export const LeaseReviewModal: React.FC<LeaseReviewModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentPdfFile,
  documentFields = [],
  documentRecipients = [],
  listingAddress = 'Property'
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(documentPdfFile || null);
  const [fields, setFields] = useState<FieldFormType[]>(documentFields);
  const [recipients, setRecipients] = useState<Recipient[]>(documentRecipients);

  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!documentId || documentPdfFile) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();
          const document = data.document;
          
          if (document.documentData) {
            const docData = document.documentData;
            let docFields = docData.fields || [];
            
            if (document.fieldValues && document.fieldValues.length > 0) {
              const fieldValuesMap = new Map();
              
              document.fieldValues.forEach((fieldValue: any) => {
                fieldValuesMap.set(fieldValue.fieldId, {
                  value: fieldValue.value,
                  signerIndex: fieldValue.signerIndex,
                  signedAt: fieldValue.signedAt
                });
              });
              
              docFields = docFields.map((field: any) => {
                const fieldValue = fieldValuesMap.get(field.formId);
                if (fieldValue) {
                  return {
                    ...field,
                    value: fieldValue.value,
                    signedAt: fieldValue.signedAt,
                    signerIndex: fieldValue.signerIndex
                  };
                }
                return field;
              });
            }
            
            setFields(docFields);
            
            const docRecipients = (docData.recipients || []).map((recipient: any, index: number) => ({
              ...recipient,
              title: recipient.role === 'landlord' ? 'Landlord' : 
                     recipient.role === 'tenant' ? 'Primary Renter' :
                     recipient.role === 'guarantor' ? 'Guarantor' :
                     recipient.title || `Signer ${index + 1}`
            }));
            
            setRecipients(docRecipients);
          }
          
          if (document.pdfFileUrl) {
            const pdfResponse = await fetch(document.pdfFileUrl);
            if (pdfResponse.ok) {
              const pdfBlob = await pdfResponse.blob();
              const file = new File([pdfBlob], document.pdfFileName || 'lease.pdf', { type: 'application/pdf' });
              setPdfFile(file);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          title: "Error",
          description: "Failed to load lease document",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && documentId && !documentPdfFile) {
      fetchDocumentData();
    } else if (documentPdfFile) {
      setPdfFile(documentPdfFile);
      setFields(documentFields);
      setRecipients(documentRecipients);
    }
  }, [isOpen, documentId, documentPdfFile, documentFields, documentRecipients, toast]);

  const handleDownload = () => {
    if (documentId) {
      window.open(`/api/documents/${documentId}/view?download=true`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#0A6060]" />
              <div>
                <DialogTitle>Review Lease Agreement</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">{listingAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {documentId && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0A6060] mx-auto mb-4" />
                <p className="text-gray-600">Loading lease document...</p>
              </div>
            </div>
          ) : pdfFile ? (
            <div className="p-6 bg-gray-50">
              <PDFViewerWithFields
                file={pdfFile}
                fields={fields}
                recipients={recipients}
                pageWidth={800}
                className="mx-auto"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No lease document available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
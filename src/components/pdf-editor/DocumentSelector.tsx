'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Users } from 'lucide-react';

// Define Document interface based on what we expect from the API
interface Document {
  id: string;
  title: string;
  description?: string;
  pdfFileName: string;
  pdfFileUrl: string;
  pdfFileSize?: number;
  createdAt: Date;
  updatedAt: Date;
  templateData: any; // Contains fields and recipients
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
}

interface DocumentSelectorProps {
  onLoadDocument: (document: Document) => void;
  onClose: () => void;
  signerType: 'signer1' | 'signer2';
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  onLoadDocument,
  onClose,
  signerType,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState<string | null>(null);

  useEffect(() => {
    console.log('📄 DocumentSelector mounted with signerType:', signerType);
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Filter documents based on signer type
      const statusFilter = signerType === 'signer1' ? 'IN_PROGRESS' : 'AWAITING_SIGNER2';
      console.log(`📄 Fetching documents with status: ${statusFilter} for ${signerType}`);
      
      const response = await fetch(`/api/documents?status=${statusFilter}`);
      console.log('📄 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Fetched documents:', data);
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDocument = async (documentId: string) => {
    try {
      setLoadingDocument(documentId);
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        onLoadDocument(data.document);
      } else {
        alert('Failed to load document');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Error loading document');
    } finally {
      setLoadingDocument(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSignerTitle = () => {
    return signerType === 'signer1' ? 'Sign as Signer 1' : 'Sign as Signer 2';
  };

  const getSignerDescription = () => {
    return signerType === 'signer1' 
      ? 'Select a document to sign as the first signer (Host)'
      : 'Select a document to sign as the second signer (Renter)';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{getSignerTitle()}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getSignerDescription()}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No documents ready for signing</p>
              <p className="text-sm text-gray-500">Create and finalize documents first to sign them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleLoadDocument(document.id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg truncate pr-2">
                        {document.title}
                      </h3>
                      <div className="flex items-center">
                        {loadingDocument === document.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        ) : (
                          <Users className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {document.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{document.pdfFileName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(document.createdAt.toString())}</span>
                      </div>
                      
                      {document.updatedAt.toString() !== document.createdAt.toString() && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Modified: {formatDate(document.updatedAt.toString())}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Size: {formatFileSize(document.pdfFileSize || 0)}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {(document.templateData as any)?.fields?.length || 0} fields
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(document.templateData as any)?.recipients?.length || 0} recipients
                          </Badge>
                          <Badge 
                            variant={document.status === 'IN_PROGRESS' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {document.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
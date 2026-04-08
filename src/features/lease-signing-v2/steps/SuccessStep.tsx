'use client';

import React from 'react';
import { CheckCircle, Download, FileText, Send, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Document, DocumentRecipient } from '../types';

interface SuccessStepProps {
  document: Document;
  onDownload?: () => void;
  onSendCopy?: (recipientId: string) => void;
  onViewDocument?: () => void;
  onStartNewDocument?: () => void;
  customActions?: React.ReactNode;
}

export function SuccessStep({
  document,
  onDownload,
  onSendCopy,
  onViewDocument,
  onStartNewDocument,
  customActions
}: SuccessStepProps) {
  // Semantic helper functions
  const getCompletionTime = () => {
    const completed = document.completedAt || document.updatedAt;
    return new Date(completed).toLocaleString();
  };

  const getTotalSigners = () => 
    document.recipients?.length || 0;

  const getDocumentName = () => 
    document.name || 'Untitled Document';

  const isAllSigned = () =>
    document.recipients?.every(r => r.status === 'signed') ?? false;

  const formatSignerStatus = (recipient: DocumentRecipient) => {
    if (recipient.signedAt) {
      return `Signed on ${new Date(recipient.signedAt).toLocaleDateString()}`;
    }
    return 'Pending signature';
  };

  const getStatusColor = (status: DocumentRecipient['status']) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render helpers
  const renderSuccessHeader = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-semibold text-[#020202] mb-2">
        Document Successfully {isAllSigned() ? 'Signed' : 'Processed'}!
      </h2>
      <p className="text-[#777b8b]">
        {getDocumentName()} has been {isAllSigned() ? 'fully signed and completed' : 'processed successfully'}
      </p>
    </div>
  );

  const renderDocumentSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Document Name</p>
            <p className="font-medium">{getDocumentName()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Completed At</p>
            <p className="font-medium">{getCompletionTime()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Signers</p>
            <p className="font-medium">{getTotalSigners()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Status</p>
            <Badge className={isAllSigned() ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {isAllSigned() ? 'Fully Signed' : 'In Progress'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSignersSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Signer Status
        </CardTitle>
        <CardDescription>
          {isAllSigned() 
            ? 'All parties have successfully signed the document'
            : 'Signature collection progress'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {document.recipients?.map((recipient, index) => (
            <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{recipient.name}</p>
                  <p className="text-sm text-gray-500">{recipient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(recipient.status)}>
                  {recipient.status === 'signed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {recipient.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatSignerStatus(recipient)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>What would you like to do next?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {onDownload && (
            <Button 
              onClick={onDownload}
              className="bg-[#3c8787] hover:bg-[#2d6666]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          
          {onViewDocument && (
            <Button 
              variant="outline"
              onClick={onViewDocument}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Document
            </Button>
          )}
        </div>

        {document.recipients && document.recipients.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Send copies to signers:</p>
              {document.recipients.map(recipient => (
                <Button
                  key={recipient.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSendCopy?.(recipient.id)}
                >
                  <Send className="w-3 h-3 mr-2" />
                  Send to {recipient.name}
                </Button>
              ))}
            </div>
          </>
        )}

        {customActions && (
          <>
            <Separator />
            {customActions}
          </>
        )}

        {onStartNewDocument && (
          <>
            <Separator />
            <Button 
              variant="outline"
              className="w-full"
              onClick={onStartNewDocument}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Start New Document
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderNextSteps = () => (
    <Card className="mt-6 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>The signed document has been saved to your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>All parties will receive email notifications with the signed copy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>You can access this document anytime from your documents page</span>
          </li>
          {!isAllSigned() && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">→</span>
              <span>Pending signers will receive reminder emails</span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderSuccessHeader()}
      {renderDocumentSummary()}
      {renderSignersSummary()}
      {renderQuickActions()}
      {renderNextSteps()}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Plus, Home, Eye } from 'lucide-react';
import Link from 'next/link';

interface LeaseTemplateSuccessPageProps {
  params: { listingId: string };
}

export default function LeaseTemplateSuccessPage({ params }: LeaseTemplateSuccessPageProps) {
  const searchParams = useSearchParams();
  const { listingId } = params;
  const [templateDetails, setTemplateDetails] = useState<{
    id: string;
    title: string;
    type: string;
    fieldsCount: number;
    recipientsCount: number;
    pdfFileName: string;
  } | null>(null);
  
  // Get template details from URL params or sessionStorage
  useEffect(() => {
    const templateId = searchParams.get('templateId');
    const templateName = searchParams.get('templateName');
    const templateType = searchParams.get('templateType') || 'lease';
    const fieldsCount = parseInt(searchParams.get('fieldsCount') || '0');
    const recipientsCount = parseInt(searchParams.get('recipientsCount') || '0');
    const pdfFileName = searchParams.get('pdfFileName') || 'document.pdf';
    
    if (templateId && templateName) {
      setTemplateDetails({
        id: templateId,
        title: decodeURIComponent(templateName),
        type: templateType,
        fieldsCount,
        recipientsCount,
        pdfFileName
      });
    } else {
      // Fallback to sessionStorage if URL params are missing
      const storedTemplateId = sessionStorage.getItem('currentTemplateId');
      if (storedTemplateId) {
        setTemplateDetails({
          id: storedTemplateId,
          title: 'Template',
          type: 'lease',
          fieldsCount: 0,
          recipientsCount: 0,
          pdfFileName: 'document.pdf'
        });
      }
    }
  }, [searchParams]);

  const getDocumentTypeDisplay = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lease': return 'Lease';
      case 'addendum': return 'Addendum';
      case 'disclosure': return 'Disclosure';
      default: return 'Document';
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Template Created Successfully!
          </h1>
          
          {templateDetails && (
            <p className="text-lg text-gray-600 mb-8">
              Your {getDocumentTypeDisplay(templateDetails.type)} template "{templateDetails.title}" has been created and is ready to use.
            </p>
          )}

          {/* Template Details */}
          {templateDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Template Details
              </h2>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Template Name</p>
                  <p className="font-medium text-gray-900">{templateDetails.title}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Document Type</p>
                  <p className="font-medium text-gray-900">{getDocumentTypeDisplay(templateDetails.type)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Signature Fields</p>
                  <p className="font-medium text-gray-900">{templateDetails.fieldsCount} fields</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Recipients</p>
                  <p className="font-medium text-gray-900">{templateDetails.recipientsCount} recipients</p>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              What's Next?
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
                <p className="text-gray-700">
                  Your template is now available in your lease templates library
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <p className="text-gray-700">
                  You can use this template to create lease documents for future bookings
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <p className="text-gray-700">
                  Renters will be able to sign this document during the booking process
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="flex items-center gap-2 bg-[#3c8787] hover:bg-[#2d6666]"
            >
              <Link href={`/app/host/${listingId}/leases`}>
                <Eye className="w-4 h-4" />
                View All Templates
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2 border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787]/10"
            >
              <Link href={`/app/host/${listingId}/leases/create`}>
                <Plus className="w-4 h-4" />
                Create Another Template
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href={`/app/host/${listingId}/applications`}>
                <Home className="w-4 h-4" />
                View Applications
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
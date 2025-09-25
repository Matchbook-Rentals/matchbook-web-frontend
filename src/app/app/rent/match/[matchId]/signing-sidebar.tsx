'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import type { FieldFormType } from '@/components/pdf-editor/types';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';

interface SigningSidebarProps {
  fields: FieldFormType[];
  recipients: Recipient[];
  currentSignerIndex: number;
  signedFields: Record<string, any>;
  onNavigateToField: (fieldId: string) => void;
}

export function SigningSidebar({
  fields,
  recipients,
  currentSignerIndex,
  signedFields,
  onNavigateToField
}: SigningSidebarProps) {
  const currentSigner = recipients[currentSignerIndex];

  if (!currentSigner) {
    return null;
  }

  // Get signature and initial fields for current signer
  const signerFields = fields.filter(f => {
    if (f.recipientIndex !== currentSignerIndex) return false;
    const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
    return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
  });

  const completedFields = signerFields.filter(f => !!signedFields[f.formId]);
  const completionPercentage = signerFields.length > 0 ? Math.round((completedFields.length / signerFields.length) * 100) : 0;

  return (
    <div className="flex items-start gap-2.5 p-4 md:p-6 relative bg-[#e7f0f0] rounded-lg overflow-hidden">
      <div className="flex flex-col items-start gap-4 relative flex-1 min-w-0">
        {/* Signer Information Card */}
        <Card className="relative w-full bg-white rounded-lg border border-solid border-[#e6e6e6]">
          <CardContent className="flex flex-col items-start gap-3 p-4">
            <div className="flex items-start gap-3 relative w-full">
              <div
                className="w-6 h-6 rounded-3xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: currentSigner.color }}
              >
                <span className="text-white text-sm [font-family:'Poppins',Helvetica] font-normal">
                  {currentSigner.name.charAt(0)}
                </span>
              </div>

              <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-0">
                <div className="w-full [font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-tight truncate">
                  {currentSigner.name}
                </div>
                <div className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#717171] text-sm tracking-[0] leading-tight truncate">
                  {currentSigner.email}
                </div>
              </div>
            </div>

            <p className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#717171] text-sm tracking-[0] leading-tight">
              Click on the fields assigned to you to fill them out and sign the document.
            </p>
          </CardContent>
        </Card>

        {/* Required Fields Card */}
        <Card className="relative w-full bg-white rounded border border-solid border-[#e3e3e3]">
          <CardContent className="p-4">
            <h2 className="w-full [font-family:'Poppins',Helvetica] font-medium text-black text-sm tracking-[0] leading-tight mb-3">
              Your Fields to Complete ({completedFields.length}/{signerFields.length})
            </h2>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#0a6060] h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            {signerFields.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">No signature required</p>
                <p className="text-sm text-gray-500">
                  This document does not require any signatures from you. You may review the document and proceed when ready.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {signerFields.map(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                  const friendlyType = fieldType === 'SIGNATURE' ? 'Signature' : 'Initials';
                  const isCompleted = !!signedFields[field.formId];

                  return (
                    <div
                      key={field.formId}
                      className="flex items-center justify-between px-4 py-3 relative w-full bg-[#e6e6e6] rounded cursor-pointer hover:bg-[#dde7e7] transition-colors"
                      onClick={() => onNavigateToField(field.formId)}
                      title="Click to navigate to this field in the PDF"
                    >
                      <div className="flex items-center justify-between relative flex-1 grow">
                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0] leading-6 whitespace-nowrap">
                            {friendlyType}
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#777b8b] text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                            Page {field.pageNumber || 1}
                          </div>
                        </div>

                        <div className="inline-flex items-start relative flex-[0_0_auto]">
                          {isCompleted ? (
                            <div className="bg-[#e9f7ee] border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee] inline-flex items-center gap-1.5 px-2.5 py-1 relative flex-[0_0_auto] rounded-full border border-solid">
                              <CheckCircle className="w-4 h-4" />
                              <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-xs text-center tracking-[0] leading-5 whitespace-nowrap">
                                Signed
                              </span>
                            </div>
                          ) : (
                            <div className="bg-white border-[#8a8a8a] text-[#8a8a8a] hover:bg-white inline-flex items-center gap-1.5 px-2.5 py-1 relative flex-[0_0_auto] rounded-full border border-solid">
                              <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-xs text-center tracking-[0] leading-5 whitespace-nowrap">
                                Pending
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
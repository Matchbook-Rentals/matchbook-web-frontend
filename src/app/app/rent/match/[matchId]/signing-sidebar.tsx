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
  currentRenterEmail?: string;
}

export function SigningSidebar({
  fields,
  recipients,
  currentSignerIndex,
  signedFields,
  onNavigateToField,
  currentRenterEmail
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
        {/* TEMPORARY DEBUG: Recipient Matching Info - Remove after testing */}
        {currentRenterEmail && (
          <Card className="relative w-full bg-yellow-50 rounded-lg border-2 border-yellow-400">
            <CardContent className="p-3">
              <div className="text-xs font-mono space-y-1">
                <div className="font-bold text-yellow-900 mb-2">🔍 DEBUG: Recipient Matching</div>
                <div><span className="font-semibold">Your Email:</span> {currentRenterEmail}</div>
                <div><span className="font-semibold">Matched Index:</span> {currentSignerIndex}</div>
                <div><span className="font-semibold">Total Recipients:</span> {recipients.length}</div>

                <div className="pt-2 border-t border-yellow-300 mt-2">
                  <div className="font-semibold mb-1">All Recipients:</div>
                  {recipients.map((r, i) => (
                    <div key={i} className={`ml-2 ${i === currentSignerIndex ? 'bg-yellow-200 px-1' : ''}`}>
                      [{i}] {r.email} - {r.role}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-yellow-300 mt-2">
                  <div className="font-semibold mb-1">Matched Recipient:</div>
                  <div>Name: {currentSigner.name}</div>
                  <div>Email: {currentSigner.email}</div>
                  <div>Role: {currentSigner.role}</div>
                </div>

                <div className="pt-2 border-t border-yellow-300 mt-2">
                  <div className="font-semibold mb-1">Your Fields ({signerFields.length}):</div>
                  {signerFields.length === 0 ? (
                    <div className="text-red-600 ml-2">⚠️ NO FIELDS FOUND FOR YOUR INDEX!</div>
                  ) : (
                    <div className="ml-2 space-y-2 max-h-64 overflow-y-auto">
                      {signerFields.map((f, i) => {
                        const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                        const isSigned = !!signedFields[f.formId];
                        const signedValue = signedFields[f.formId];
                        return (
                          <div key={f.formId} className={`border-2 ${isSigned ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} p-2 rounded text-[10px]`}>
                            <div className="font-bold">{isSigned ? '✓ SIGNED' : '✗ UNSIGNED'} - {fieldType}</div>
                            <div className="mt-1 space-y-0.5">
                              <div><span className="font-semibold">Full ID:</span> {f.formId}</div>
                              <div><span className="font-semibold">recipientIndex:</span> {f.recipientIndex}</div>
                              <div><span className="font-semibold">Position:</span> Page {f.pageNumber} @ ({f.pageX.toFixed(1)}, {f.pageY.toFixed(1)})</div>
                              <div><span className="font-semibold">Size:</span> {f.pageWidth}x{f.pageHeight}</div>
                              <div><span className="font-semibold">Signed Value:</span> {signedValue ? JSON.stringify(signedValue).slice(0, 50) : 'null'}</div>
                              <div><span className="font-semibold">In signedFields:</span> {f.formId in signedFields ? 'YES' : 'NO'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-yellow-300 mt-2">
                  <div className="font-semibold mb-1">All Signature Fields (Total {fields.filter(f => {
                    const ft = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                    return ft === 'SIGNATURE' || ft === 'INITIALS';
                  }).length}):</div>
                  <div className="ml-2 text-[9px] max-h-96 overflow-y-auto space-y-1">
                    {fields.filter(f => {
                      const ft = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      return ft === 'SIGNATURE' || ft === 'INITIALS';
                    }).map((f, i) => {
                      const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      const isSigned = !!signedFields[f.formId];
                      const signedValue = signedFields[f.formId];
                      const assignedRecipient = recipients[f.recipientIndex];
                      const isYours = f.recipientIndex === currentSignerIndex;

                      return (
                        <div key={f.formId} className={`${isYours ? 'border-2 border-yellow-500 bg-yellow-100' : 'bg-gray-100'} p-1.5 rounded`}>
                          <div className="font-bold">
                            {isYours ? '👉 YOUR FIELD' : `[${f.recipientIndex}]`} - {fieldType} - {isSigned ? '✓ SIGNED' : '✗ UNSIGNED'}
                          </div>
                          <div className="mt-0.5 space-y-0.5 ml-1">
                            <div><span className="font-semibold">ID:</span> {f.formId}</div>
                            <div><span className="font-semibold">recipientIndex:</span> {f.recipientIndex}</div>
                            <div><span className="font-semibold">Assigned to:</span> {assignedRecipient?.name || 'Unknown'} ({assignedRecipient?.email || 'N/A'})</div>
                            <div><span className="font-semibold">Page:</span> {f.pageNumber} @ Y:{f.pageY.toFixed(1)}</div>
                            <div><span className="font-semibold">Signed:</span> {isSigned ? 'YES' : 'NO'}</div>
                            <div><span className="font-semibold">Value:</span> {signedValue ? (typeof signedValue === 'object' ? JSON.stringify(signedValue).slice(0, 40) : String(signedValue).slice(0, 40)) : 'null'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
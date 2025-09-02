'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';
import { useEffect } from 'react';

interface HostSidebarFrameProps {
  hostName: string;
  hostEmail: string;
  documentFields: any[];
  // fieldsStatus is now provided by context
}

export function HostSidebarFrame({ 
  hostName, 
  hostEmail, 
  documentFields
}: HostSidebarFrameProps) {
  const { signedFields, setSignedField } = useSignedFieldsStore();
  
  // Convert signedFields to fieldsStatus format
  const fieldsStatus = Object.fromEntries(
    Object.entries(signedFields).map(([fieldId, value]) => [
      fieldId, 
      value ? 'signed' : 'pending'
    ])
  );

  // Auto-fill date fields when corresponding signature/initial fields are signed
  useEffect(() => {
    const hostFields = documentFields.filter(field => field.recipientIndex === 0);
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });

    hostFields.forEach(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      
      // If a SIGNATURE field is signed, auto-fill any corresponding SIGN_DATE fields
      if (fieldType === 'SIGNATURE' && signedFields[field.formId]) {
        const signDateFields = hostFields.filter(f => {
          const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
          return fType === 'SIGN_DATE';
        });
        
        signDateFields.forEach(dateField => {
          if (!signedFields[dateField.formId]) {
            setSignedField(dateField.formId, currentDate);
          }
        });
      }
      
      // If an INITIALS field is signed, auto-fill any corresponding INITIAL_DATE fields
      if (fieldType === 'INITIALS' && signedFields[field.formId]) {
        const initialDateFields = hostFields.filter(f => {
          const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
          return fType === 'INITIAL_DATE';
        });
        
        initialDateFields.forEach(dateField => {
          if (!signedFields[dateField.formId]) {
            setSignedField(dateField.formId, currentDate);
          }
        });
      }
    });
  }, [signedFields, documentFields, setSignedField]);
  // Debug logging to catch object rendering issues
  
  // Get host-specific fields for sidebar display (recipientIndex === 0)
  const getHostFields = () => {
    return documentFields.filter(field => field.recipientIndex === 0);
  };

  // Group fields by type for display
  const getFieldsByType = () => {
    const hostFields = getHostFields();
    const signatures = hostFields.filter(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      return ['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    const otherFields = hostFields.filter(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      return !['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    
    return { signatures, otherFields };
  };

  // Calculate completion status - only count SIGNATURE and INITIALS fields
  const getCompletionStatus = () => {
    const hostFields = getHostFields();
    const signatureFields = hostFields.filter(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      return ['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    const completedSignatureFields = signatureFields.filter(field => fieldsStatus[field.formId] === 'signed');
    return {
      completed: completedSignatureFields.length,
      total: signatureFields.length,
      percentage: signatureFields.length > 0 ? Math.round((completedSignatureFields.length / signatureFields.length) * 100) : 0
    };
  };

  const completionStatus = getCompletionStatus();
  const { signatures, otherFields } = getFieldsByType();

  return (
    <div className="flex items-start gap-2.5 p-4 md:p-6 relative bg-[#e7f0f0] rounded-lg overflow-hidden">
      <div className="flex flex-col items-start gap-4 relative flex-1 min-w-0">
        <h1 className="relative w-full [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-lg md:text-xl lg:text-2xl tracking-[0] leading-tight">
          Review and Sign Documents
        </h1>

        <div className="flex flex-col items-start gap-4 relative w-full">
          {/* Host Information Card */}
          <Card className="relative w-full bg-white rounded-lg border border-solid border-[#e6e6e6]">
            <CardContent className="flex flex-col items-start gap-3 p-4">
              <div className="flex items-start gap-3 relative w-full">
                <div className="w-6 h-6 bg-[#0a6060] rounded-3xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm [font-family:'Poppins',Helvetica] font-normal">
                    {hostName?.[0] || 'H'}
                  </span>
                </div>

                <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-0">
                  <div className="w-full [font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-tight truncate">
                    {hostName}
                  </div>
                  <div className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#717171] text-sm tracking-[0] leading-tight truncate">
                    {hostEmail}
                  </div>
                </div>
              </div>

              {(() => {
                const hostFields = getHostFields();
                const signatures = hostFields.filter(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                  return fieldType === 'SIGNATURE';
                });
                const initials = hostFields.filter(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                  return fieldType === 'INITIALS';
                });
                
                const pendingSignatures = signatures.filter(field => fieldsStatus[field.formId] !== 'signed').length;
                const pendingInitials = initials.filter(field => fieldsStatus[field.formId] !== 'signed').length;
                
                return (
                  <>
                    {pendingSignatures > 0 && (
                      <div className="flex items-center gap-3 relative w-full">
                        <div className="w-5 h-5 bg-[#0a6060] rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#0a6060] text-sm tracking-[0] leading-tight">
                          {pendingSignatures} pending signature{pendingSignatures !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    {pendingInitials > 0 && (
                      <div className="flex items-center gap-3 relative w-full">
                        <div className="w-5 h-5 bg-[#0a6060] rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#0a6060] text-sm tracking-[0] leading-tight">
                          {pendingInitials} pending initial{pendingInitials !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    {pendingSignatures === 0 && pendingInitials === 0 && (
                      <div className="flex items-center gap-3 relative w-full">
                        <div className="w-5 h-5 bg-[#0a6060] rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#0a6060] text-sm tracking-[0] leading-tight">
                          All signature fields completed
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <p className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#717171] text-sm tracking-[0] leading-tight">
                Click on the fields assigned to you to fill them out and sign the document.
              </p>
            </CardContent>
          </Card>

          {/* Required Lease Fields Card */}
          <Card className="relative w-full bg-white rounded border border-solid border-[#e3e3e3]">
            <CardContent className="p-4">
              <h2 className="w-full [font-family:'Poppins',Helvetica] font-medium text-black text-sm tracking-[0] leading-tight mb-3">
                Required Lease Fields ({completionStatus.completed}/{completionStatus.total})
              </h2>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-[#0a6060] h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionStatus.percentage}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                {/* Signature Fields */}
                {signatures.map((field, index) => {
                  const status = fieldsStatus[field.formId] || 'pending';
                  return (
                    <div
                      key={field.formId}
                      className="flex items-center justify-between px-4 py-3 relative w-full bg-[#e6e6e6] rounded"
                    >
                      <div className="flex items-center justify-between relative flex-1 grow">
                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0] leading-6 whitespace-nowrap">
                            {(() => {
                              const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                              return fieldType === 'SIGNATURE' ? 'Signature' : fieldType === 'INITIALS' ? 'Initials' : 'Signature';
                            })()}
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#777b8b] text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                            Page {(() => {
                              const pageNum = field.page !== undefined ? field.page : field.pageNumber;
                              // If pageNum is already 1-based, don't add 1. If it's 0-based, add 1.
                              // Since there's only 1 page, correct value should be 1
                              return pageNum !== undefined ? (pageNum === 0 ? 1 : pageNum) : '?';
                            })()}
                          </div>
                        </div>

                        <div className="inline-flex items-start relative flex-[0_0_auto]">
                          {status === 'signed' ? (
                            <div className="bg-[#e9f7ee] border-[#1ca34e] text-[#1ca34e] hover:bg-[#e9f7ee] inline-flex items-center gap-1.5 px-2.5 py-1 relative flex-[0_0_auto] rounded-full border border-solid">
                              <CheckCircle className="w-5 h-5" />
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

                {/* Date fields and other non-signature fields are hidden from the sidebar */}
                {/* They are automatically filled when signatures/initials are completed */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

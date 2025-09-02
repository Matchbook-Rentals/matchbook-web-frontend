'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Calendar, DollarSign, CreditCard, Shield } from 'lucide-react';
import { MatchWithRelations } from '@/types';

interface RenterSidebarFrameProps {
  match: MatchWithRelations;
  documentFields: any[];
  fieldsStatus?: Record<string, 'signed' | 'pending'>;
  showTitle?: boolean;
}

export function RenterSidebarFrame({ match, documentFields, fieldsStatus = {}, showTitle = true }: RenterSidebarFrameProps) {
  // Debug logging to catch object rendering issues
  console.log('🔍 RenterSidebarFrame - documentFields:', documentFields);
  console.log('🔍 RenterSidebarFrame - fieldsStatus:', fieldsStatus);
  
  // Check each field for problematic objects
  documentFields.forEach((field, index) => {
    console.log(`🔍 RenterSidebarFrame - field[${index}]:`, {
      formId: field.formId,
      type: field.type,
      typeOf: typeof field.type,
      fieldMeta: field.fieldMeta,
      page: field.page,
      recipientIndex: field.recipientIndex
    });
  });
  // Get tenant-specific fields for sidebar display
  const getTenantFields = () => {
    return documentFields.filter(field => field.recipientIndex === 1);
  };

  // Group fields by type for display
  const getFieldsByType = () => {
    const tenantFields = getTenantFields();
    const signatures = tenantFields.filter(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      return ['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    const otherFields = tenantFields.filter(field => {
      const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
      return !['SIGNATURE', 'INITIALS'].includes(fieldType);
    });
    
    return { signatures, otherFields };
  };

  // Calculate completion status
  const getCompletionStatus = () => {
    const tenantFields = getTenantFields();
    const completedFields = tenantFields.filter(field => fieldsStatus[field.formId] === 'signed');
    return {
      completed: completedFields.length,
      total: tenantFields.length,
      percentage: tenantFields.length > 0 ? Math.round((completedFields.length / tenantFields.length) * 100) : 0
    };
  };

  const completionStatus = getCompletionStatus();
  const { signatures, otherFields } = getFieldsByType();

  return (
    <div className="flex items-start gap-2.5 p-4 md:p-6 relative bg-[#e7f0f0] rounded-lg overflow-hidden">
      <div className="flex flex-col items-start gap-4 relative flex-1 min-w-0">
        {showTitle && (
          <h1 className="relative w-full [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-lg md:text-xl lg:text-2xl tracking-[0] leading-tight">
            Review and Sign Documents
          </h1>
        )}

        <div className="flex flex-col items-start gap-4 relative w-full">
          {/* Host Information Card */}
          <Card className="relative w-full bg-white rounded-lg border border-solid border-[#e6e6e6]">
            <CardContent className="flex flex-col items-start gap-3 p-4">
              <div className="flex items-start gap-3 relative w-full">
                <div className="w-6 h-6 bg-[#0a6060] rounded-3xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm [font-family:'Poppins',Helvetica] font-normal">
                    {match.listing.user?.firstName?.[0] || 'H'}
                  </span>
                </div>

                <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-0">
                  <div className="w-full [font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-tight truncate">
                    {match.listing.user?.firstName} {match.listing.user?.lastName}
                  </div>
                  <div className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#717171] text-sm tracking-[0] leading-tight truncate">
                    {match.listing.user?.email}
                  </div>
                </div>
              </div>

              {(() => {
                const tenantFields = getTenantFields();
                const signatures = tenantFields.filter(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                  return fieldType === 'SIGNATURE';
                });
                const initials = tenantFields.filter(field => {
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
                              
                              // Check if there's a corresponding date field for this signature/initial field
                              const hasCorrespondingDateField = () => {
                                const targetDateType = fieldType === 'SIGNATURE' ? 'SIGN_DATE' : fieldType === 'INITIALS' ? 'INITIAL_DATE' : null;
                                if (!targetDateType) return false;
                                
                                return documentFields.some(f => {
                                  const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                                  return fType === targetDateType && f.recipientIndex === field.recipientIndex;
                                });
                              };
                              
                              if (fieldType === 'SIGNATURE') {
                                return 'Signature';
                              } else if (fieldType === 'INITIALS') {
                                return 'Initials';
                              }
                              return 'Signature';
                            })()}
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#777b8b] text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                            Page {(() => {
                              const pageNum = field.page !== undefined ? field.page : field.pageNumber;
                              console.log('🔍 Page debug for field', field.formId, ':', {
                                page: field.page,
                                pageNumber: field.pageNumber,
                                calculated: pageNum
                              });
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

                {/* Other Fields */}
                {otherFields.map((field) => {
                  const status = fieldsStatus[field.formId] || 'pending';
                  // Safely extract string value from field type/meta to prevent React child errors
                  const fieldName = (() => {
                    console.log(`🔍 Processing field ${field.formId}:`, {
                      fieldMeta: field.fieldMeta,
                      fieldType: field.type,
                      fieldTypeType: typeof field.type
                    });
                    
                    if (field.fieldMeta?.label && typeof field.fieldMeta.label === 'string') {
                      console.log(`🔍 Using fieldMeta.label: "${field.fieldMeta.label}"`);
                      return field.fieldMeta.label;
                    }
                    if (typeof field.type === 'string') {
                      console.log(`🔍 Using field.type string: "${field.type}"`);
                      return field.type;
                    }
                    if (typeof field.type === 'object' && field.type) {
                      const result = field.type.value || field.type.type || 'Field';
                      console.log(`🔍 Using field.type object result: "${result}"`);
                      return result;
                    }
                    console.log('🔍 Using fallback: "Field"');
                    return 'Field';
                  })();
                  
                  return (
                    <div
                      key={field.formId}
                      className="flex items-center justify-between px-4 py-3 relative w-full bg-[#e6e6e6] rounded"
                    >
                      <div className="flex items-center justify-between relative flex-1 grow">
                        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0] leading-6 whitespace-nowrap">
                            {fieldName}
                          </div>
                          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#777b8b] text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                            Page {(() => {
                              const pageNum = field.page !== undefined ? field.page : field.pageNumber;
                              console.log('🔍 Page debug for field', field.formId, ':', {
                                page: field.page,
                                pageNumber: field.pageNumber,
                                calculated: pageNum
                              });
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
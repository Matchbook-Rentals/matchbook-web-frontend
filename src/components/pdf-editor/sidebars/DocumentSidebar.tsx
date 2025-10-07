'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';
import { type Recipient } from '../RecipientManager';
import { FieldFormType, MatchDetails } from '../types';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';
import { getFieldLabel as getFieldLabelUtil } from '@/utils/fieldLabelUtils';

interface DocumentSidebarProps {
  tripMatchDetails: MatchDetails | null;
  recipients: Recipient[];
  fields: FieldFormType[];
  signedFieldsStore: typeof useSignedFieldsStore;
  navigateToField: (fieldId: string) => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  tripMatchDetails,
  recipients,
  fields,
  signedFieldsStore,
  navigateToField,
}) => {
  return (
    <>
      {/* Document Information Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#3c8787]" />
            <h3 className="font-medium text-gray-900">Document Information</h3>
          </div>

          {tripMatchDetails && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">Property Address</div>
                <div className="font-medium">{tripMatchDetails.propertyAddress}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-600">Monthly Rent</div>
                  <div className="font-medium">{tripMatchDetails.monthlyPrice}</div>
                </div>
                <div>
                  <div className="text-gray-600">Lease Term</div>
                  <div className="font-medium">{tripMatchDetails.startDate && tripMatchDetails.endDate ? `${new Date(tripMatchDetails.startDate).toLocaleDateString()} - ${new Date(tripMatchDetails.endDate).toLocaleDateString()}` : 'Not set'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#3c8787]" />
            <h3 className="font-medium text-gray-900">Recipients</h3>
          </div>

          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: recipient.color || '#3c8787' }}
                >
                  {recipient.name.charAt(0) || recipient.role.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{recipient.name || `${recipient.role} User`}</div>
                  <div className="text-xs text-gray-500 truncate">{recipient.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {recipient.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3c8787]" />
              <h3 className="font-medium text-gray-900">Field Summary</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {(() => {
                // Count fields using same logic as the display filter
                const filteredFieldCount = fields.filter(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');

                  if (fieldType === 'SIGN_DATE' || fieldType === 'INITIAL_DATE') {
                    // Check if there's a corresponding signature/initial field for the same recipient
                    const targetSignatureType = fieldType === 'SIGN_DATE' ? 'SIGNATURE' : 'INITIALS';
                    const hasCorrespondingSignature = fields.some(f => {
                      const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      return fType === targetSignatureType && f.signerEmail === field.signerEmail;
                    });

                    // Count date field only if it doesn't have a corresponding signature/initial field
                    return !hasCorrespondingSignature;
                  }

                  return true; // Count all non-date fields
                }).length;
                return filteredFieldCount;
              })()} fields
            </Badge>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                // Check which signature/initial fields have corresponding date fields for the same recipient
                const getCorrespondingDateField = (signatureField: any) => {
                  const fieldType = typeof signatureField.type === 'string' ? signatureField.type : (signatureField.type?.type || signatureField.type?.value || '');
                  const targetDateType = fieldType === 'SIGNATURE' ? 'SIGN_DATE' : fieldType === 'INITIALS' ? 'INITIAL_DATE' : null;

                  if (!targetDateType) return null;

                  return fields.find(field => {
                    const fType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                    return fType === targetDateType && field.signerEmail === signatureField.signerEmail;
                  });
                };

                // Filter out date fields that have corresponding signature/initial fields
                const filteredFields = fields.filter(field => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');

                  if (fieldType === 'SIGN_DATE' || fieldType === 'INITIAL_DATE') {
                    // Check if there's a corresponding signature/initial field for the same recipient
                    const targetSignatureType = fieldType === 'SIGN_DATE' ? 'SIGNATURE' : 'INITIALS';
                    const hasCorrespondingSignature = fields.some(f => {
                      const fType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
                      return fType === targetSignatureType && f.signerEmail === field.signerEmail;
                    });

                    // Hide date field only if it has a corresponding signature/initial field
                    return !hasCorrespondingSignature;
                  }

                  return true; // Show all non-date fields
                });

                return filteredFields.map((field, index) => {
                  const fieldValue = signedFieldsStore.getState().signedFields[field.formId];
                  const hasValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
                  // Try to find recipient by ID first, then by email, then by role mapping
                  let recipient = recipients.find(r => r.id === field.signerEmail);
                  if (!recipient) {
                    recipient = recipients.find(r => r.email === field.signerEmail);
                  }

                  // Handle different recipient ID patterns by mapping to roles
                  if (!recipient) {
                    const signerEmail = field.signerEmail.toLowerCase();
                    if (signerEmail.includes('host')) {
                      recipient = recipients.find(r => r.role === 'HOST');
                    } else if (signerEmail.includes('renter') || signerEmail.includes('tenant')) {
                      recipient = recipients.find(r => r.role === 'RENTER');
                    }
                  }

                  // Debug logging to understand signerEmail values
                  if (!recipient) {
                    console.log(`🔍 Field ${field.formId} signerEmail: "${field.signerEmail}", Available recipient IDs:`, recipients.map(r => r.id), 'Available emails:', recipients.map(r => r.email), 'Available roles:', recipients.map(r => r.role));
                  }

                  // Get field label with combined signature+date labeling only when both fields exist
                  const getDisplayLabel = (field: any) => {
                    const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                    const recipientRole = recipient?.role || 'Unknown';

                    if (fieldType === 'SIGNATURE' || fieldType === 'INITIALS') {
                      const correspondingDateField = getCorrespondingDateField(field);
                      if (correspondingDateField) {
                        // Both signature/initial and date field exist
                        return `${recipientRole === 'HOST' ? 'Host' : 'Renter'} ${fieldType === 'SIGNATURE' ? 'Signature' : 'Initial'} and Date`;
                      } else {
                        // Only signature/initial field exists
                        return `${recipientRole === 'HOST' ? 'Host' : 'Renter'} ${fieldType === 'SIGNATURE' ? 'Signature' : 'Initial'}`;
                      }
                    }

                    // For other fields, use the original logic
                    return (field.fieldMeta?.label && field.fieldMeta.label !== 'Field') ? field.fieldMeta.label : getFieldLabelUtil(field, recipients);
                  };

                  return (
                    <div
                      key={field.formId}
                      className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm cursor-pointer transition-colors duration-150"
                      onClick={() => navigateToField(field.formId)}
                      title="Click to navigate to this field in the PDF"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {getDisplayLabel(field)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Page {field.pageNumber} • {recipient?.name || 'Unassigned'}
                        </div>
                      </div>
                      <div className="text-right min-w-0 flex-shrink-0">
                        {hasValue ? (
                          <div className="text-xs text-green-600 font-medium truncate max-w-24" title={String(fieldValue)}>
                            {String(fieldValue).length > 20 ? `${String(fieldValue).substring(0, 20)}...` : String(fieldValue)}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Empty
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No fields available
            </div>
          )}
        </CardContent>
      </Card>


    </>
  );
};

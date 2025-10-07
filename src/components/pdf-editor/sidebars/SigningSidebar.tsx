'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Recipient } from '../RecipientManager';
import { FieldFormType, FRIENDLY_FIELD_TYPE } from '../types';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';

interface SigningSidebarProps {
  getCurrentSigner: () => Recipient | null;
  fields: FieldFormType[];
  signedFieldsStore: typeof useSignedFieldsStore;
}

export const SigningSidebar: React.FC<SigningSidebarProps> = ({
  getCurrentSigner,
  fields,
  signedFieldsStore,
}) => {
  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getCurrentSigner()?.color }}
            >
              {getCurrentSigner()?.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{getCurrentSigner()?.name}</div>
              <div className="text-sm text-gray-500">{getCurrentSigner()?.email}</div>
            </div>
          </div>


          <p className="text-sm text-gray-600">
            Click on the fields assigned to you to fill them out and sign the document.
          </p>
        </CardContent>
      </Card>

      {/* Fields to sign */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Your Fields to Complete</h3>
          {(() => {
            const renterFields = fields
              .filter(f => f.recipientIndex === 1)
              .filter(f => ['SIGNATURE', 'INITIALS'].includes(f.type));

            console.log('🎯 PDFEditor Sidebar - Renter fields:', {
              totalFields: fields.length,
              renterFieldsAll: fields.filter(f => f.recipientIndex === 1).length,
              renterSignatureFields: renterFields.length,
              fields: renterFields.map(f => ({ formId: f.formId, type: f.type, page: f.pageNumber }))
            });

            if (renterFields.length === 0) {
              return (
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
              );
            }

            return (
              <div className="space-y-2">
                {renterFields.map(field => (
                  <div key={field.formId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{FRIENDLY_FIELD_TYPE[field.type]}</span>
                      <span className="text-xs text-gray-500">Page {field.pageNumber}</span>
                    </div>
                    <div className="text-xs">
                      {signedFieldsStore.getState().signedFields[field.formId] ? (
                        <Badge variant="default" className="bg-green-500">✓ Signed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </>
  );
};

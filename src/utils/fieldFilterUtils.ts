import { FieldFormType } from '@/components/pdf-editor/types';

export interface GetUnsignedFieldsParams {
  fields: FieldFormType[];
  currentSignerIndex: number;
  currentSignedFields: Record<string, any>;
}

/**
 * Filters fields to find unsigned signature/initial fields for the current signer.
 *
 * @param params - Object containing fields array, current signer index, and signed fields
 * @returns Array of unsigned signature/initial fields for the current signer
 */
export function getUnsignedFields(params: GetUnsignedFieldsParams): FieldFormType[] {
  const { fields, currentSignerIndex, currentSignedFields } = params;

  const allSignatureFields = fields.filter(f => {
    if (f.recipientIndex !== currentSignerIndex) return false;

    // Use same field type extraction logic as HostSidebarFrame
    const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
    return ['SIGNATURE', 'INITIALS'].includes(fieldType);
  });

  // Use same simple truthy check as sidebar (which works correctly)
  const unsignedFields = allSignatureFields.filter(f => {
    const value = currentSignedFields[f.formId];

    // Use simple truthy check like sidebar instead of complex check
    const isSigned = !!value; // Same as sidebar: value ? 'signed' : 'pending'

    // Log for debugging
    if (f.formId === 'LxS-E2U7k7Z7' || f.formId === 'LgqJ5yFm37Ic') {
      console.log(`🔍 Field ${f.formId} signed status:`, {
        value: value,
        isSigned: isSigned,
        signedFieldsKeys: Object.keys(currentSignedFields),
        hasTargetField: f.formId in currentSignedFields
      });
    }

    return !isSigned;
  });

  // Sort fields by visual position: page number, then Y (top to bottom), then X (left to right)
  const sortedUnsignedFields = unsignedFields.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    if (a.pageY !== b.pageY) {
      return a.pageY - b.pageY;
    }
    return a.pageX - b.pageX;
  });

  // Focus on first unsigned field for debugging
  const firstUnsignedField = sortedUnsignedFields[0];
  if (firstUnsignedField) {
    const value = currentSignedFields[firstUnsignedField.formId];
    console.log('🔍 FIRST UNSIGNED FIELD (sorted by position):', {
      formId: firstUnsignedField.formId,
      type: firstUnsignedField.type,
      pageNumber: firstUnsignedField.pageNumber,
      pageY: firstUnsignedField.pageY,
      pageX: firstUnsignedField.pageX,
      isInSignedFields: firstUnsignedField.formId in currentSignedFields,
      signedFieldValue: value,
      signedFieldType: typeof value,
      signedFieldKeys: typeof value === 'object' && value ? Object.keys(value) : null,
      totalUnsignedCount: sortedUnsignedFields.length
    });
  } else {
    console.log('🔍 NO UNSIGNED FIELDS - All signature fields are signed');
  }

  return sortedUnsignedFields;
}

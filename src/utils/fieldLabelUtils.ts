import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from '@/components/pdf-editor/types';

/**
 * Generates a human-readable label for a PDF field based on its type and recipient.
 *
 * @param field - The field to generate a label for
 * @returns A descriptive label string for the field
 */
export function getFieldLabel(field: FieldFormType): string {
  // Add debug logging for field type issues
  if (!field.type) {
    console.warn('Field has no type:', field);
    return 'Unknown Field';
  }

  // Better recipient determination with proper undefined handling
  let recipientPrefix = 'Unassigned';
  if (field.recipientIndex === 0) {
    recipientPrefix = 'Host';
  } else if (field.recipientIndex === 1) {
    recipientPrefix = 'Primary Renter';
  } else if (field.signerEmail) {
    // Fallback to signerEmail analysis
    if (field.signerEmail.includes('host')) {
      recipientPrefix = 'Host';
    } else if (field.signerEmail.includes('renter')) {
      recipientPrefix = 'Primary Renter';
    }
  }

  switch (field.type) {
    case 'SIGNATURE':
    case FieldType.SIGNATURE:
      return `${recipientPrefix} Signature`;
    case 'INITIALS':
    case FieldType.INITIALS:
      return `${recipientPrefix} Initials`;
    case 'NAME':
    case FieldType.NAME:
      return `${recipientPrefix} Name`;
    case 'EMAIL':
    case FieldType.EMAIL:
      return `${recipientPrefix} Email`;
    case 'SIGN_DATE':
    case FieldType.SIGN_DATE:
      return `${recipientPrefix} Sign Date`;
    case 'INITIAL_DATE':
    case FieldType.INITIAL_DATE:
      return `${recipientPrefix} Initial Date`;
    case 'DATE':
    case FieldType.DATE:
      // Try to identify date purpose from context
      const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
      if (fieldLabel.includes('move') || fieldLabel.includes('start') || fieldLabel.includes('begin')) {
        return 'Move-in Date';
      } else if (fieldLabel.includes('end') || fieldLabel.includes('expire') || fieldLabel.includes('terminate')) {
        return 'Move-out Date';
      } else if (fieldLabel.includes('sign')) {
        return 'Signing Date';
      } else {
        return `Date (Page ${field.pageNumber})`;
      }
    case 'NUMBER':
    case FieldType.NUMBER:
      // Try to identify number field purpose
      const numberLabel = field.fieldMeta?.label?.toLowerCase() || '';
      if (numberLabel.includes('rent') || numberLabel.includes('price')) {
        return 'Monthly Rent';
      } else if (numberLabel.includes('deposit')) {
        return 'Security Deposit';
      } else {
        return `Amount (Page ${field.pageNumber})`;
      }
    case 'TEXT':
    case FieldType.TEXT:
      // Try to identify text field purpose
      const textLabel = field.fieldMeta?.label?.toLowerCase() || '';
      if (textLabel.includes('address') || textLabel.includes('property')) {
        return 'Property Address';
      } else if (textLabel.includes('rent')) {
        return 'Rent Amount';
      } else {
        return `Text (Page ${field.pageNumber})`;
      }
    case 'RADIO':
    case FieldType.RADIO:
      return `Radio Options (Page ${field.pageNumber})`;
    case 'CHECKBOX':
    case FieldType.CHECKBOX:
      return `Checkbox (Page ${field.pageNumber})`;
    case 'DROPDOWN':
    case FieldType.DROPDOWN:
      return `Dropdown (Page ${field.pageNumber})`;
    default:
      console.warn('Unknown field type in getFieldLabel:', {
        type: field.type,
        recipientIndex: field.recipientIndex,
        signerEmail: field.signerEmail,
        formId: field.formId,
        fieldMeta: field.fieldMeta
      });
      const friendlyName = FRIENDLY_FIELD_TYPE[field.type] || field.type;
      return recipientPrefix !== 'Unassigned' ? `${recipientPrefix} ${friendlyName}` : friendlyName;
  }
}

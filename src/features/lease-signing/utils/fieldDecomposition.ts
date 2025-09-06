/**
 * Field management decomposition helpers
 * Breaking down complex field operations into semantic functions
 * Following the 10-line maximum rule
 */

import { FieldFormType, FieldType } from '@/components/pdf-editor/types';
import { WorkflowPhase, SignerState } from '../types/workflow.types';

// ===== FIELD VALIDATION HELPERS =====

export const isSignatureField = (field: FieldFormType): boolean =>
  field.type === FieldType.SIGNATURE;

export const isInitialsField = (field: FieldFormType): boolean =>
  field.type === FieldType.INITIALS;

export const isSigningField = (field: FieldFormType): boolean =>
  isSignatureField(field) || isInitialsField(field);

export const isRequiredField = (field: FieldFormType): boolean =>
  field.required === true;

export const isFieldComplete = (
  field: FieldFormType,
  signedFields: Record<string, any>
): boolean =>
  signedFields[field.formId] != null;

export const belongsToRecipient = (
  field: FieldFormType,
  recipientIndex: number
): boolean =>
  field.recipientIndex === recipientIndex;

// ===== FIELD FILTERING HELPERS =====

export const getFieldsForPhase = (
  fields: FieldFormType[],
  phase: WorkflowPhase
): FieldFormType[] => {
  if (phase === 'template' || phase === 'document') {
    return fields; // Show all fields during setup
  }
  return fields;
};

export const getFieldsForCurrentSigner = (
  fields: FieldFormType[],
  signerIndex: number
): FieldFormType[] =>
  fields.filter(field => belongsToRecipient(field, signerIndex));

export const getSignatureFields = (fields: FieldFormType[]): FieldFormType[] =>
  fields.filter(isSignatureField);

export const getInitialsFields = (fields: FieldFormType[]): FieldFormType[] =>
  fields.filter(isInitialsField);

export const getRequiredFields = (fields: FieldFormType[]): FieldFormType[] =>
  fields.filter(isRequiredField);

export const getIncompleteFields = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): FieldFormType[] =>
  fields.filter(field => !isFieldComplete(field, signedFields));

// ===== FIELD COUNTING HELPERS =====

export const countTotalFields = (fields: FieldFormType[]): number =>
  fields.length;

export const countSignedFields = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): number =>
  fields.filter(field => isFieldComplete(field, signedFields)).length;

export const countRemainingFields = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): number =>
  countTotalFields(fields) - countSignedFields(fields, signedFields);

export const calculateFieldProgress = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): number => {
  const total = countTotalFields(fields);
  if (total === 0) return 100;
  const signed = countSignedFields(fields, signedFields);
  return Math.round((signed / total) * 100);
};

// ===== FIELD STATE HELPERS =====

export const areAllRequiredFieldsSigned = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): boolean => {
  const requiredFields = getRequiredFields(fields);
  return requiredFields.every(field => isFieldComplete(field, signedFields));
};

export const areAllSignerFieldsComplete = (
  fields: FieldFormType[],
  signerIndex: number,
  signedFields: Record<string, any>
): boolean => {
  const signerFields = getFieldsForCurrentSigner(fields, signerIndex);
  const requiredSignerFields = getRequiredFields(signerFields);
  return requiredSignerFields.every(field => isFieldComplete(field, signedFields));
};

export const hasUnsignedRequiredFields = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): boolean =>
  !areAllRequiredFieldsSigned(fields, signedFields);

// ===== FIELD DISPLAY HELPERS =====

export const shouldShowField = (
  field: FieldFormType,
  phase: WorkflowPhase,
  currentSignerIndex?: number
): boolean => {
  if (phase === 'template' || phase === 'document') {
    return true; // Show all fields during setup
  }
  
  if (phase === 'signing' && currentSignerIndex !== undefined) {
    return belongsToRecipient(field, currentSignerIndex);
  }
  
  return false;
};

export const shouldEnableField = (
  field: FieldFormType,
  phase: WorkflowPhase,
  currentSignerIndex?: number
): boolean => {
  if (phase === 'template') {
    return true; // All fields editable in template phase
  }
  
  if (phase === 'document') {
    return !isSigningField(field); // Non-signature fields editable
  }
  
  if (phase === 'signing' && currentSignerIndex !== undefined) {
    return belongsToRecipient(field, currentSignerIndex) && isSigningField(field);
  }
  
  return false;
};

export const getFieldOpacity = (
  field: FieldFormType,
  phase: WorkflowPhase
): number => {
  if (phase === 'template' || phase === 'document') {
    return 0.3; // Semi-transparent during setup
  }
  return 1.0; // Full opacity during signing
};

// ===== FIELD LABELING HELPERS =====

export const getFieldLabel = (field: FieldFormType): string => {
  if (field.fieldMeta?.label) {
    return field.fieldMeta.label;
  }
  
  const typeLabels: Record<string, string> = {
    [FieldType.SIGNATURE]: 'Signature',
    [FieldType.INITIALS]: 'Initials',
    [FieldType.NAME]: 'Name',
    [FieldType.EMAIL]: 'Email',
    [FieldType.DATE]: 'Date',
    [FieldType.TEXT]: 'Text',
    [FieldType.NUMBER]: 'Number',
    [FieldType.CHECKBOX]: 'Checkbox',
    [FieldType.DROPDOWN]: 'Dropdown'
  };
  
  return typeLabels[field.type] || 'Field';
};

export const getFieldDescription = (
  field: FieldFormType,
  recipientName?: string
): string => {
  const label = getFieldLabel(field);
  const recipient = recipientName || `Signer ${(field.recipientIndex || 0) + 1}`;
  return `${label} for ${recipient}`;
};

// ===== FIELD GROUPING HELPERS =====

export const groupFieldsByRecipient = (
  fields: FieldFormType[]
): Map<number, FieldFormType[]> => {
  const grouped = new Map<number, FieldFormType[]>();
  
  fields.forEach(field => {
    const index = field.recipientIndex || 0;
    const group = grouped.get(index) || [];
    group.push(field);
    grouped.set(index, group);
  });
  
  return grouped;
};

export const groupFieldsByType = (
  fields: FieldFormType[]
): Map<FieldType, FieldFormType[]> => {
  const grouped = new Map<FieldType, FieldFormType[]>();
  
  fields.forEach(field => {
    const type = field.type as FieldType;
    const group = grouped.get(type) || [];
    group.push(field);
    grouped.set(type, group);
  });
  
  return grouped;
};

export const groupFieldsByPage = (
  fields: FieldFormType[]
): Map<number, FieldFormType[]> => {
  const grouped = new Map<number, FieldFormType[]>();
  
  fields.forEach(field => {
    const page = field.page;
    const group = grouped.get(page) || [];
    group.push(field);
    grouped.set(page, group);
  });
  
  return grouped;
};

// ===== FIELD SORTING HELPERS =====

export const sortFieldsByPosition = (fields: FieldFormType[]): FieldFormType[] =>
  [...fields].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

export const sortFieldsByRecipient = (fields: FieldFormType[]): FieldFormType[] =>
  [...fields].sort((a, b) => 
    (a.recipientIndex || 0) - (b.recipientIndex || 0)
  );

export const sortFieldsByType = (fields: FieldFormType[]): FieldFormType[] => {
  const typeOrder = [
    FieldType.SIGNATURE,
    FieldType.INITIALS,
    FieldType.NAME,
    FieldType.DATE,
    FieldType.EMAIL,
    FieldType.TEXT,
    FieldType.NUMBER,
    FieldType.CHECKBOX,
    FieldType.DROPDOWN
  ];
  
  return [...fields].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.type as FieldType);
    const bIndex = typeOrder.indexOf(b.type as FieldType);
    return aIndex - bIndex;
  });
};

// ===== FIELD ERROR HELPERS =====

export const getFieldError = (
  field: FieldFormType,
  signedFields: Record<string, any>
): string | null => {
  if (!isRequiredField(field)) return null;
  if (isFieldComplete(field, signedFields)) return null;
  
  return `${getFieldLabel(field)} is required`;
};

export const getFieldErrors = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): Array<{ fieldId: string; error: string }> => {
  const errors: Array<{ fieldId: string; error: string }> = [];
  
  fields.forEach(field => {
    const error = getFieldError(field, signedFields);
    if (error) {
      errors.push({ fieldId: field.formId, error });
    }
  });
  
  return errors;
};

export const hasFieldErrors = (
  fields: FieldFormType[],
  signedFields: Record<string, any>
): boolean =>
  getFieldErrors(fields, signedFields).length > 0;
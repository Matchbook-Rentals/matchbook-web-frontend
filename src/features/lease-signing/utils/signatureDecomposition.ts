/**
 * Signature management decomposition helpers
 * Breaking down complex signature operations into semantic functions
 * Following the 10-line maximum rule
 */

import { FieldFormType, FieldType } from '@/components/pdf-editor/types';

interface UserSignature {
  id: string;
  type: 'drawn' | 'typed';
  data: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SignatureValidation {
  isValid: boolean;
  error?: string;
}

// ===== SIGNATURE TYPE HELPERS =====

export const isDrawnSignature = (signature: UserSignature): boolean =>
  signature.type === 'drawn';

export const isTypedSignature = (signature: UserSignature): boolean =>
  signature.type === 'typed';

export const getSignatureType = (data: string): 'drawn' | 'typed' =>
  data.startsWith('data:image') ? 'drawn' : 'typed';

// ===== SIGNATURE VALIDATION =====

export const validateSignatureData = (data: string): SignatureValidation => {
  if (!data || data.trim() === '') {
    return { isValid: false, error: 'Signature data is empty' };
  }
  
  if (isImageData(data) && !isValidImageData(data)) {
    return { isValid: false, error: 'Invalid image data format' };
  }
  
  return { isValid: true };
};

export const isImageData = (data: string): boolean =>
  data.startsWith('data:image');

export const isValidImageData = (data: string): boolean => {
  const regex = /^data:image\/(png|jpeg|jpg|svg\+xml);base64,/;
  return regex.test(data);
};

export const hasSignature = (
  fieldId: string,
  signedFields: Record<string, any>
): boolean =>
  signedFields[fieldId] != null && signedFields[fieldId] !== '';

// ===== SIGNATURE FIELD HELPERS =====

export const getSignatureFields = (
  fields: FieldFormType[],
  recipientIndex?: number
): FieldFormType[] => {
  let signatureFields = fields.filter(f => 
    f.type === FieldType.SIGNATURE || f.type === FieldType.INITIALS
  );
  
  if (recipientIndex !== undefined) {
    signatureFields = signatureFields.filter(f => 
      f.recipientIndex === recipientIndex
    );
  }
  
  return signatureFields;
};

export const getUnsignedSignatureFields = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): FieldFormType[] => {
  const signatureFields = getSignatureFields(fields, recipientIndex);
  return signatureFields.filter(field => !hasSignature(field.formId, signedFields));
};

export const countSignatureFields = (
  fields: FieldFormType[],
  recipientIndex?: number
): number =>
  getSignatureFields(fields, recipientIndex).length;

export const countSignedSignatures = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): number => {
  const signatureFields = getSignatureFields(fields, recipientIndex);
  return signatureFields.filter(field => 
    hasSignature(field.formId, signedFields)
  ).length;
};

// ===== INITIALS HELPERS =====

export const generateInitials = (fullName: string): string => {
  if (!fullName) return '';
  
  const parts = fullName.trim().split(/\s+/);
  const initials = parts
    .map(part => part.charAt(0).toUpperCase())
    .join('');
  
  return initials.slice(0, 3); // Max 3 characters
};

export const validateInitials = (initials: string): SignatureValidation => {
  if (!initials || initials.trim() === '') {
    return { isValid: false, error: 'Initials are required' };
  }
  
  if (initials.length > 4) {
    return { isValid: false, error: 'Initials too long (max 4 characters)' };
  }
  
  return { isValid: true };
};

export const shouldAutoFillInitials = (
  field: FieldFormType,
  userInitials?: string
): boolean =>
  field.type === FieldType.INITIALS && userInitials != null && userInitials !== '';

// ===== SIGNATURE STORAGE HELPERS =====

export const prepareSignatureForStorage = (
  signature: string,
  type: 'drawn' | 'typed',
  fontFamily?: string
): UserSignature => ({
  id: generateSignatureId(),
  type,
  data: signature,
  fontFamily: type === 'typed' ? fontFamily : undefined,
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const generateSignatureId = (): string =>
  `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const findDefaultSignature = (
  signatures: UserSignature[]
): UserSignature | undefined =>
  signatures.find(sig => sig.isDefault);

export const sortSignaturesByDate = (
  signatures: UserSignature[]
): UserSignature[] =>
  [...signatures].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

// ===== SIGNATURE APPLICATION HELPERS =====

export const applySignatureToField = (
  fieldId: string,
  signature: string,
  signedFields: Record<string, any>
): Record<string, any> => ({
  ...signedFields,
  [fieldId]: signature
});

export const applySignatureToAllFields = (
  signature: string,
  signatureType: FieldType,
  fields: FieldFormType[],
  recipientIndex: number,
  signedFields: Record<string, any>
): Record<string, any> => {
  const targetFields = fields.filter(f => 
    f.type === signatureType && 
    f.recipientIndex === recipientIndex
  );
  
  let updated = { ...signedFields };
  targetFields.forEach(field => {
    updated[field.formId] = signature;
  });
  
  return updated;
};

export const clearSignatureFromField = (
  fieldId: string,
  signedFields: Record<string, any>
): Record<string, any> => {
  const updated = { ...signedFields };
  delete updated[fieldId];
  return updated;
};

// ===== SIGNATURE PROGRESS HELPERS =====

export const calculateSignatureProgress = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): number => {
  const total = countSignatureFields(fields, recipientIndex);
  if (total === 0) return 100;
  
  const signed = countSignedSignatures(fields, signedFields, recipientIndex);
  return Math.round((signed / total) * 100);
};

export const areAllSignaturesComplete = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): boolean => {
  const unsignedFields = getUnsignedSignatureFields(
    fields,
    signedFields,
    recipientIndex
  );
  
  // Only check required signature fields
  const requiredUnsigned = unsignedFields.filter(f => f.required);
  return requiredUnsigned.length === 0;
};

export const getNextUnsignedField = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): FieldFormType | null => {
  const unsignedFields = getUnsignedSignatureFields(
    fields,
    signedFields,
    recipientIndex
  );
  
  if (unsignedFields.length === 0) return null;
  
  // Prioritize required fields
  const requiredField = unsignedFields.find(f => f.required);
  return requiredField || unsignedFields[0];
};

// ===== SIGNATURE UI HELPERS =====

export const getSignatureButtonLabel = (
  field: FieldFormType,
  hasSignature: boolean
): string => {
  if (hasSignature) {
    return field.type === FieldType.SIGNATURE ? 'Change Signature' : 'Change Initials';
  }
  return field.type === FieldType.SIGNATURE ? 'Add Signature' : 'Add Initials';
};

export const getSignatureFieldStatus = (
  field: FieldFormType,
  signedFields: Record<string, any>
): 'signed' | 'required' | 'optional' => {
  if (hasSignature(field.formId, signedFields)) {
    return 'signed';
  }
  return field.required ? 'required' : 'optional';
};

export const getSignatureFieldColor = (
  status: 'signed' | 'required' | 'optional'
): string => {
  const colors = {
    signed: 'border-green-500 bg-green-50',
    required: 'border-red-500 bg-red-50',
    optional: 'border-gray-300 bg-gray-50'
  };
  return colors[status];
};

// ===== SIGNATURE VALIDATION MESSAGES =====

export const getSignatureErrorMessage = (
  field: FieldFormType,
  signedFields: Record<string, any>
): string | null => {
  if (!field.required) return null;
  if (hasSignature(field.formId, signedFields)) return null;
  
  const fieldType = field.type === FieldType.SIGNATURE ? 'Signature' : 'Initials';
  return `${fieldType} is required`;
};

export const getAllSignatureErrors = (
  fields: FieldFormType[],
  signedFields: Record<string, any>,
  recipientIndex?: number
): string[] => {
  const signatureFields = getSignatureFields(fields, recipientIndex);
  const errors: string[] = [];
  
  signatureFields.forEach(field => {
    const error = getSignatureErrorMessage(field, signedFields);
    if (error) errors.push(error);
  });
  
  return errors;
};
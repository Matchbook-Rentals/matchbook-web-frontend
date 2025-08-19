// Field types matching Documenso implementation
export enum FieldType {
  SIGNATURE = 'SIGNATURE',
  INITIALS = 'INITIALS',
  EMAIL = 'EMAIL',
  NAME = 'NAME',
  DATE = 'DATE',
  SIGN_DATE = 'SIGN_DATE',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  DROPDOWN = 'DROPDOWN',
}

// Field metadata for advanced configuration
export interface FieldMeta {
  label?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  // Type-specific options
  values?: Array<{ value: string; checked?: boolean }>; // For checkbox/radio
  minLength?: number; // For text fields
  maxLength?: number;
  pattern?: string; // Regex validation
  textAlign?: 'left' | 'center' | 'right';
  direction?: 'horizontal' | 'vertical'; // For checkbox/radio layout
}

// Field form type using percentage-based positioning
export interface FieldFormType {
  nativeId?: number;
  formId: string;
  pageNumber: number;
  type: FieldType;
  pageX: number; // Percentage of page width (0-100)
  pageY: number; // Percentage of page height (0-100)
  pageWidth: number; // Percentage of page width
  pageHeight: number; // Percentage of page height
  signerEmail: string;
  fieldMeta?: FieldMeta;
  recipientIndex?: number;
}

// Constants
export const MIN_HEIGHT_PX = 12;
export const MIN_WIDTH_PX = 36;
export const DEFAULT_HEIGHT_PX = MIN_HEIGHT_PX * 2.5;
export const DEFAULT_WIDTH_PX = MIN_WIDTH_PX * 2.5;

// Field type dimensions
export const FIELD_DIMENSIONS = {
  SIGNATURE: { width: 200, height: 60 },
  INITIALS: { width: 80, height: 40 },
  TEXT: { width: 200, height: 40 },
  EMAIL: { width: 200, height: 40 },
  NAME: { width: 200, height: 40 },
  DATE: { width: 150, height: 40 },
  SIGN_DATE: { width: 150, height: 40 },
  NUMBER: { width: 120, height: 40 },
  CHECKBOX: { width: 40, height: 40 },
  RADIO: { width: 40, height: 40 },
  DROPDOWN: { width: 200, height: 40 },
};

// Advanced field types that need settings
export const ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING = [
  FieldType.NUMBER,
  FieldType.RADIO,
  FieldType.CHECKBOX,
  FieldType.DROPDOWN,
  FieldType.TEXT,
  FieldType.INITIALS,
  FieldType.EMAIL,
  FieldType.DATE,
  FieldType.SIGN_DATE,
  FieldType.NAME,
];

// Friendly field type names
export const FRIENDLY_FIELD_TYPE: Record<FieldType, string> = {
  [FieldType.SIGNATURE]: 'Signature',
  [FieldType.INITIALS]: 'Initials',
  [FieldType.EMAIL]: 'Email',
  [FieldType.NAME]: 'Name',
  [FieldType.DATE]: 'Date',
  [FieldType.SIGN_DATE]: 'Sign Date',
  [FieldType.TEXT]: 'Text',
  [FieldType.NUMBER]: 'Number',
  [FieldType.RADIO]: 'Radio',
  [FieldType.CHECKBOX]: 'Checkbox',
  [FieldType.DROPDOWN]: 'Dropdown',
};

// Recipient information
export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'viewer' | 'approver';
}

// Match details for pre-populating document fields
export interface MatchDetails {
  propertyAddress: string;
  monthlyPrice: string;
  hostName: string;
  hostEmail: string;
  primaryRenterName: string;
  primaryRenterEmail: string;
  startDate: string;
  endDate: string;
}
import { create } from 'zustand';

interface SignedFieldsState {
  signedFields: Record<string, any>;
  
  // Actions
  setSignedField: (fieldId: string, value: any) => void;
  getSignedFields: () => Record<string, any>;
  initializeSignedFields: (initialFields: Record<string, any>) => void;
  clearSignedFields: () => void;
  hasSignedField: (fieldId: string) => boolean;
  getSignedField: (fieldId: string) => any;
}

export const useSignedFieldsStore = create<SignedFieldsState>((set, get) => ({
  signedFields: {},

  setSignedField: (fieldId: string, value: any) => {
    console.log('🏪 Zustand - Setting field:', {
      fieldId,
      value: value ? 'SIGNED' : 'CLEARED'
    });

    set((state) => {
      // If value is null or undefined, remove the field entirely
      if (value === null || value === undefined) {
        const { [fieldId]: _, ...rest } = state.signedFields;
        return { signedFields: rest };
      }

      // Otherwise, set the field value
      return {
        signedFields: {
          ...state.signedFields,
          [fieldId]: value
        }
      };
    });

    console.log('🏪 Zustand - Field updated:', fieldId in get().signedFields);
  },

  getSignedFields: () => {
    return get().signedFields;
  },

  initializeSignedFields: (initialFields: Record<string, any>) => {
    set({ signedFields: initialFields });
  },

  clearSignedFields: () => {
    set({ signedFields: {} });
  },

  hasSignedField: (fieldId: string) => {
    return fieldId in get().signedFields;
  },

  getSignedField: (fieldId: string) => {
    return get().signedFields[fieldId];
  }
}));
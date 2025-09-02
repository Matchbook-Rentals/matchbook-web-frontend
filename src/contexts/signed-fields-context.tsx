"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SignedFieldsContextValue {
  signedFields: Record<string, any>;
  setSignedField: (fieldId: string, value: any) => void;
  getSignedFields: () => Record<string, any>;
  initializeSignedFields: (initialFields: Record<string, any>) => void;
  clearSignedFields: () => void;
}

const SignedFieldsContext = createContext<SignedFieldsContextValue | null>(null);

interface SignedFieldsProviderProps {
  children: ReactNode;
  initialSignedFields?: Record<string, any>;
}

export function SignedFieldsProvider({ children, initialSignedFields = {} }: SignedFieldsProviderProps) {
  const [signedFields, setSignedFields] = useState<Record<string, any>>(initialSignedFields);

  const setSignedField = useCallback((fieldId: string, value: any) => {
    console.log('🔄 SignedFieldsContext - Setting field:', {
      fieldId,
      value: value ? 'SIGNED' : 'CLEARED'
    });
    
    setSignedFields(prev => {
      const newSignedFields = {
        ...prev,
        [fieldId]: value
      };
      console.log('🔄 SignedFieldsContext - Field updated:', fieldId in newSignedFields);
      return newSignedFields;
    });
  }, []);

  const getSignedFields = useCallback(() => {
    return signedFields;
  }, [signedFields]);

  const initializeSignedFields = useCallback((initialFields: Record<string, any>) => {
    console.log('📝 SignedFieldsContext - Initializing with', Object.keys(initialFields).length, 'fields');
    setSignedFields(initialFields);
  }, []);

  const clearSignedFields = useCallback(() => {
    console.log('🧹 SignedFieldsContext - Clearing all signed fields');
    setSignedFields({});
  }, []);

  const value: SignedFieldsContextValue = {
    signedFields,
    setSignedField,
    getSignedFields,
    initializeSignedFields,
    clearSignedFields
  };

  return (
    <SignedFieldsContext.Provider value={value}>
      {children}
    </SignedFieldsContext.Provider>
  );
}

export function useSignedFields(): SignedFieldsContextValue {
  const context = useContext(SignedFieldsContext);
  if (!context) {
    throw new Error('useSignedFields must be used within a SignedFieldsProvider');
  }
  return context;
}
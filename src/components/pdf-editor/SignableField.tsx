'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { useRecipientColors } from './recipient-colors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SignatureDialog } from './SignatureDialog';
import type { Recipient } from './RecipientManager';

interface UserSignature {
  id: string;
  type: 'drawn' | 'typed';
  data: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SignableFieldProps {
  field: FieldFormType;
  recipient?: Recipient;
  onSign: (fieldId: string, value: any) => void;
  isSigned: boolean;
  signedValue?: any;
  isForCurrentSigner: boolean;
  pageElement: HTMLElement;
  savedSignatures?: UserSignature[];
  onSaveSignature?: (type: 'drawn' | 'typed', data: string, fontFamily?: string, setAsDefault?: boolean) => Promise<void>;
  onDeleteSignature?: (id: string) => Promise<void>;
  onSetDefaultSignature?: (id: string) => Promise<void>;
}

export const SignableField: React.FC<SignableFieldProps> = ({ 
  field, 
  recipient,
  onSign, 
  isSigned, 
  signedValue, 
  isForCurrentSigner,
  pageElement,
  savedSignatures = [],
  onSaveSignature,
  onDeleteSignature,
  onSetDefaultSignature
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isViewingSignature, setIsViewingSignature] = useState(false);
  const [inputValue, setInputValue] = useState(signedValue || '');
  
  const recipientIndex = field.recipientIndex ?? 0;
  const signerStyles = useRecipientColors(recipientIndex);

  // Early return if pageElement is not available
  if (!pageElement) {
    return null;
  }

  // Calculate pixel positions from percentages
  const pageRect = pageElement.getBoundingClientRect();
  const x = (field.pageX / 100) * pageRect.width;
  const y = (field.pageY / 100) * pageRect.height;
  const width = (field.pageWidth / 100) * pageRect.width;
  const height = (field.pageHeight / 100) * pageRect.height;

  const handleAutoSign = () => {
    // For signature fields, use the recipient's name directly
    let signatureValue;
    
    // Try to get the name from the recipient or field info
    if (recipient && recipient.name) {
      signatureValue = recipient.name;
    } else if (field.signerEmail) {
      // Fallback: extract name from email
      signatureValue = field.signerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      signatureValue = 'Digital Signature';
    }
    
    onSign(field.formId, signatureValue);
  };

  const handleSign = () => {
    let value = inputValue;
    
    // Generate appropriate default values based on field type
    if (!value) {
      switch (field.type) {
        case FieldType.SIGNATURE:
          value = `${field.signerEmail} - Digital Signature`;
          break;
        case FieldType.INITIALS:
          const parts = field.signerEmail.split('@')[0].split('.');
          value = parts.map(p => p.charAt(0).toUpperCase()).join('');
          break;
        case FieldType.NAME:
          value = field.signerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
        case FieldType.EMAIL:
          value = field.signerEmail;
          break;
        case FieldType.DATE:
          value = '';  // Date fields should be empty until filled during signing
          break;
        case FieldType.TEXT:
          value = 'Sample text';
          break;
        case FieldType.NUMBER:
          value = '123';
          break;
        case FieldType.CHECKBOX:
          value = true;
          break;
        default:
          value = 'Signed';
      }
    }
    
    onSign(field.formId, value);
    setIsDialogOpen(false);
  };

  const handleSignatureSign = (signature: string, type: 'drawn' | 'typed', fontFamily?: string) => {
    // Store the signature with metadata for proper display
    const signatureData = {
      value: signature,
      type: type,
      fontFamily: fontFamily
    };
    onSign(field.formId, signatureData);
  };

  const handleClearSignature = () => {
    // Clear the signature by setting it to null/undefined
    onSign(field.formId, null);
    setIsViewingSignature(false);
  };

  const displayValue = () => {
    if (isSigned) {
      if (field.type === FieldType.CHECKBOX) {
        return signedValue ? '☑' : '☐';
      }
      if (field.type === FieldType.SIGNATURE && typeof signedValue === 'object' && signedValue?.type) {
        // Handle new signature format with metadata
        if (signedValue.type === 'drawn') {
          return (
            <img 
              src={signedValue.value} 
              alt="Signature" 
              className="h-full object-contain"
            />
          );
        } else if (signedValue.type === 'typed') {
          const fontClass = signedValue.fontFamily ? 
            `font-signature-${signedValue.fontFamily}` : 
            'font-signature-dancing';
          return (
            <span className={`${fontClass} text-base`}>
              {signedValue.value}
            </span>
          );
        }
      }
      return signedValue?.value || signedValue;
    }
    
    // For signature and name fields, show recipient title if available
    if ((field.type === FieldType.SIGNATURE || field.type === FieldType.NAME) && recipient?.title) {
      const fieldTypeName = field.type === FieldType.SIGNATURE ? 'Signature' : 'Name';
      return `${recipient.title} ${fieldTypeName}`;
    }
    
    return FRIENDLY_FIELD_TYPE[field.type];
  };

  return (
    <>
      <div
        data-field-id={field.formId}
        className={cn(
          'absolute transition-all',
          'border-2 rounded flex items-center justify-center text-center text-sm font-medium',
          // Current signer's fields
          isForCurrentSigner && !isSigned && 'cursor-pointer hover:scale-105 hover:shadow-lg bg-white/90 border-blue-400',
          isForCurrentSigner && isSigned && 'cursor-pointer bg-green-50 border-green-500',
          // Other signer's fields  
          !isForCurrentSigner && isSigned && 'cursor-not-allowed bg-gray-100 border-gray-400 opacity-80',
          !isForCurrentSigner && !isSigned && 'cursor-not-allowed bg-white/50 border-gray-300 opacity-60',
          signerStyles.base,
        )}
        style={{
          left: x,
          top: y,
          width: width,
          height: height,
          zIndex: 30,
        }}
        onClick={() => {
          // Allow current signer to interact with all fields, others can only view
          if (!isForCurrentSigner && !isSigned) return;
          
          // If field is signed and user is current signer, show viewing dialog
          if (isSigned && isForCurrentSigner) {
            if (field.type === FieldType.SIGNATURE) {
              setIsViewingSignature(true);
            } else {
              setIsDialogOpen(true);
            }
            return;
          }
          
          // If field is signed but user is not current signer, show read-only view
          if (isSigned && !isForCurrentSigner) {
            if (field.type === FieldType.SIGNATURE) {
              setIsViewingSignature(true);
            } else {
              setIsDialogOpen(true);
            }
            return;
          }
          
          // If field is not signed and user is current signer, allow signing
          if (!isSigned && isForCurrentSigner) {
            if (field.type === FieldType.SIGNATURE) {
              setIsSignatureDialogOpen(true);
            } else {
              setIsDialogOpen(true);
            }
          }
        }}
      >
        <div className={cn(
          'px-2 text-xs font-medium truncate',
          isSigned ? 'text-green-800' : 'text-gray-700',
          // Apply cursive font for signed signature fields
          isSigned && field.type === FieldType.SIGNATURE && 'font-signature text-base'
        )}>
          {displayValue()}
        </div>
        
        {isSigned && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      {/* Signing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign {FRIENDLY_FIELD_TYPE[field.type]} Field</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter your {FRIENDLY_FIELD_TYPE[field.type].toLowerCase()}:</label>
              {field.type === FieldType.CHECKBOX ? (
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={inputValue === true}
                      onChange={(e) => setInputValue(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Check this box</span>
                  </label>
                </div>
              ) : (
                <Input
                  type={field.type === FieldType.EMAIL ? 'email' : field.type === FieldType.NUMBER ? 'number' : 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Enter ${FRIENDLY_FIELD_TYPE[field.type].toLowerCase()}...`}
                  className="mt-2"
                />
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSign}>
                Sign Field
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <SignatureDialog
        isOpen={isSignatureDialogOpen}
        onClose={() => setIsSignatureDialogOpen(false)}
        onSign={handleSignatureSign}
        recipientName={recipient?.name || 'User'}
        savedSignatures={savedSignatures}
        onSaveSignature={onSaveSignature}
        onDeleteSignature={onDeleteSignature}
        onSetDefaultSignature={onSetDefaultSignature}
      />

      {/* Signature Viewing Dialog */}
      <Dialog open={isViewingSignature} onOpenChange={setIsViewingSignature}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {field.type === FieldType.SIGNATURE ? 'Signature' : FRIENDLY_FIELD_TYPE[field.type]}
              {recipient?.title && ` - ${recipient.title}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-6 bg-gray-50 min-h-[150px] flex items-center justify-center">
              {field.type === FieldType.SIGNATURE && signedValue ? (
                typeof signedValue === 'object' && signedValue?.type ? (
                  signedValue.type === 'drawn' ? (
                    <img 
                      src={signedValue.value} 
                      alt="Signature" 
                      className="max-h-[120px] max-w-full object-contain"
                    />
                  ) : (
                    <div className={`text-2xl ${signedValue.fontFamily ? `font-signature-${signedValue.fontFamily}` : 'font-signature-dancing'}`}>
                      {signedValue.value}
                    </div>
                  )
                ) : (
                  <div className="font-signature-dancing text-2xl">
                    {signedValue}
                  </div>
                )
              ) : (
                <div className="text-lg">
                  {signedValue || 'No content'}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsViewingSignature(false)}>
                Close
              </Button>
              
              {isForCurrentSigner && (
                <Button 
                  variant="destructive" 
                  onClick={handleClearSignature}
                >
                  Clear {field.type === FieldType.SIGNATURE ? 'Signature' : FRIENDLY_FIELD_TYPE[field.type]}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { useRecipientColors } from './recipient-colors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SignatureDialog } from './SignatureDialog';
import { InitialsDialog } from './InitialsDialog';
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
  currentInitials?: string; // Current user's saved initials
  onSaveInitials?: (initials: string) => Promise<void>; // Save initials to user.signingInitials
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
  onSetDefaultSignature,
  currentInitials,
  onSaveInitials
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isInitialsDialogOpen, setIsInitialsDialogOpen] = useState(false);
  const [isViewingSignature, setIsViewingSignature] = useState(false);
  const [inputValue, setInputValue] = useState(signedValue || '');
  
  const recipientIndex = field.recipientIndex ?? 0;
  const signerStyles = useRecipientColors(recipientIndex);
  
  // Helper function to get the border color for the signer
  const getSignerBorderColor = () => {
    const colorMap: Record<string, string> = {
      'host': '#0B6E6E',
      'primaryRenter': '#fb8c00',
      'blue': 'rgb(59, 130, 246)',
      'purple': 'rgb(168, 85, 247)',
      'green': 'rgb(34, 197, 94)',
      'red': 'rgb(239, 68, 68)',
      'pink': 'rgb(236, 72, 153)',
      'indigo': 'rgb(99, 102, 241)',
      'yellow': 'rgb(234, 179, 8)',
      'emerald': 'rgb(16, 185, 129)',
    };
    const colorKey = ['host', 'primaryRenter', 'blue', 'purple', 'green', 'red', 'pink', 'indigo', 'yellow', 'emerald'][recipientIndex % 10];
    return colorMap[colorKey];
  };
  
  // Helper function to get signer label with field type
  const getSignerLabel = () => {
    let signerName = '';
    if (recipient?.role === 'HOST') {
      signerName = 'Host';
    } else if (recipient?.role === 'RENTER') {
      signerName = 'Tenant';
    } else {
      signerName = recipient?.name || `Signer ${recipientIndex + 1}`;
    }
    
    // Get field type name
    let fieldTypeName = '';
    switch (field.type) {
      case FieldType.SIGNATURE:
        fieldTypeName = 'Signature';
        break;
      case FieldType.INITIALS:
        fieldTypeName = 'Initials';
        break;
      case FieldType.NAME:
        fieldTypeName = 'Name';
        break;
      case FieldType.EMAIL:
        fieldTypeName = 'Email';
        break;
      case FieldType.DATE:
        fieldTypeName = 'Date';
        break;
      case FieldType.TEXT:
        fieldTypeName = 'Text';
        break;
      case FieldType.NUMBER:
        fieldTypeName = 'Number';
        break;
      case FieldType.CHECKBOX:
        fieldTypeName = 'Checkbox';
        break;
      default:
        fieldTypeName = FRIENDLY_FIELD_TYPE[field.type] || 'Field';
    }
    
    return `${signerName} ${fieldTypeName}`;
  };

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

  const handleInitialsSign = (initials: string, type: 'typed', fontFamily?: string) => {
    // Store the initials with metadata for proper display
    const initialsData = {
      value: initials,
      type: type,
      fontFamily: fontFamily
    };
    onSign(field.formId, initialsData);
  };

  const handleClearSignature = () => {
    // Clear the signature by setting it to null/undefined
    onSign(field.formId, null);
    setIsViewingSignature(false);
  };

  const displayValue = () => {
    // When signed, show the actual value
    if (isSigned) {
      if (field.type === FieldType.CHECKBOX) {
        return signedValue ? '☑' : '☐';
      }
      if ((field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) && typeof signedValue === 'object' && signedValue?.type) {
        // Handle new signature/initials format with metadata
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
    
    // When not signed, show a placeholder/label
    // Get signer designation for placeholder
    let signerName = '';
    if (recipient?.role === 'HOST') {
      signerName = 'Host';
    } else if (recipient?.role === 'RENTER') {
      signerName = 'Tenant';
    } else if (recipient?.title) {
      signerName = recipient.title;
    } else {
      signerName = `Signer ${recipientIndex + 1}`;
    }
    
    // Get field type name
    let fieldTypeName = FRIENDLY_FIELD_TYPE[field.type] || 'Field';
    
    return `${signerName} ${fieldTypeName}`;
  };

  return (
    <>
      <div
        data-field-id={field.formId}
        className={cn(
          'absolute transition-all group',
          'border-2 rounded flex items-center justify-center text-center text-sm font-medium',
          // Current signer's fields
          isForCurrentSigner && !isSigned && 'cursor-pointer hover:scale-105 hover:shadow-lg bg-white/90',
          isForCurrentSigner && isSigned && 'cursor-pointer bg-green-50',
          // Other signer's fields - neutral gray styling, no green
          !isForCurrentSigner && isSigned && 'cursor-not-allowed bg-gray-50 opacity-75',
          !isForCurrentSigner && !isSigned && 'cursor-not-allowed bg-white/50 opacity-60',
        )}
        style={{
          left: x,
          top: y,
          width: width,
          height: height,
          zIndex: 30,
          borderColor: getSignerBorderColor(),
          borderWidth: '2px',
        }}
        onClick={() => {
          // Prevent any interaction with unsigned fields that belong to other signers
          if (!isForCurrentSigner && !isSigned) return;
          
          // Prevent interaction with signed fields that belong to other signers
          // Only allow viewing signature/initials for transparency
          if (!isForCurrentSigner && isSigned) {
            if (field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) {
              setIsViewingSignature(true);
            }
            // For other field types, don't allow any interaction
            return;
          }
          
          // If field is signed and user is current signer, show viewing dialog
          if (isSigned && isForCurrentSigner) {
            if (field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) {
              setIsViewingSignature(true);
            } else {
              // Show read-only view for current signer's signed fields
              setIsViewingSignature(true);
            }
            return;
          }
          
          // If field is not signed and user is current signer, allow signing
          if (!isSigned && isForCurrentSigner) {
            if (field.type === FieldType.SIGNATURE) {
              setIsSignatureDialogOpen(true);
            } else if (field.type === FieldType.INITIALS) {
              console.log('✍️ SignableField - INITIALS field clicked:', {
                fieldId: field.formId,
                currentInitials: currentInitials,
                hasCurrentInitials: !!currentInitials,
                hasOnSaveInitials: !!onSaveInitials
              });
              
              // Auto-sign with saved initials if they exist, otherwise show dialog
              if (currentInitials) {
                // User already has saved initials - auto-sign immediately
                console.log('✍️ SignableField - Auto-signing with saved initials:', currentInitials);
                handleInitialsSign(currentInitials, 'typed', 'dancing-script');
              } else {
                // No saved initials - show dialog to collect them
                console.log('✍️ SignableField - No saved initials, showing dialog');
                setIsInitialsDialogOpen(true);
              }
            } else {
              setIsDialogOpen(true);
            }
          }
        }}
      >
        <div className={cn(
          'px-2 text-xs font-medium truncate',
          // Use green text only for current signer's signed fields
          isSigned && isForCurrentSigner ? 'text-green-800' : 
          isSigned && !isForCurrentSigner ? 'text-gray-600' : 'text-gray-700',
          // Apply cursive font for signed signature/initials fields
          isSigned && (field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) && 'font-signature text-base'
        )}>
          {displayValue()}
        </div>
        
        {/* Only show green checkmark for current signer's completed fields */}
        {isSigned && isForCurrentSigner && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        
        {/* Signer label in top-left corner - only visible on hover */}
        <div 
          className="absolute -top-2 -left-2 px-1.5 py-0.5 text-[10px] font-semibold text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            backgroundColor: getSignerBorderColor(),
          }}
        >
          {getSignerLabel()}
        </div>
      </div>

      {/* Signing Dialog - Only for current signer's unsigned fields */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-center'>
              {isForCurrentSigner && !isSigned ? `Sign ${FRIENDLY_FIELD_TYPE[field.type]} Field` : `View ${FRIENDLY_FIELD_TYPE[field.type]} Field`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isForCurrentSigner && !isSigned ? (
              <>
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
              </>
            ) : (
              <>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">{FRIENDLY_FIELD_TYPE[field.type]}:</div>
                  <div className="text-lg font-medium">{signedValue || 'Not filled'}</div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                  {isForCurrentSigner && (
                    <Button 
                      variant="destructive" 
                      onClick={handleClearSignature}
                    >
                      Clear {FRIENDLY_FIELD_TYPE[field.type]}
                    </Button>
                  )}
                </div>
              </>
            )}
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

      {/* Initials Dialog */}
      <InitialsDialog
        isOpen={isInitialsDialogOpen}
        onClose={() => setIsInitialsDialogOpen(false)}
        onSign={handleInitialsSign}
        recipientName={recipient?.name || 'User'}
        currentInitials={currentInitials}
        onSaveInitials={onSaveInitials}
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
              {(field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS) && signedValue ? (
                typeof signedValue === 'object' && signedValue?.type ? (
                  signedValue.type === 'drawn' ? (
                    <img 
                      src={signedValue.value} 
                      alt={field.type === FieldType.SIGNATURE ? 'Signature' : 'Initials'} 
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
                  Clear {field.type === FieldType.SIGNATURE ? 'Signature' : field.type === FieldType.INITIALS ? 'Initials' : FRIENDLY_FIELD_TYPE[field.type]}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

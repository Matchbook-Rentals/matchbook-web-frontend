'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignatureCanvas } from './SignatureCanvas';
import { Trash2, Star, StarOff } from 'lucide-react';
import { SIGNATURE_FONTS } from './signature-fonts';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { toast } from '@/components/ui/use-toast';

interface UserSignature {
  id: string;
  type: 'drawn' | 'typed';
  data: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: string, type: 'drawn' | 'typed', fontFamily?: string) => void;
  recipientName: string;
  savedSignatures?: UserSignature[];
  onSaveSignature?: (type: 'drawn' | 'typed', data: string, fontFamily?: string, setAsDefault?: boolean) => Promise<void>;
  onDeleteSignature?: (id: string) => Promise<void>;
  onSetDefaultSignature?: (id: string) => Promise<void>;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  onClose,
  onSign,
  recipientName,
  savedSignatures = [],
  onSaveSignature,
  onDeleteSignature,
  onSetDefaultSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'saved'>('draw');
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [typedText, setTypedText] = useState<string>(recipientName);
  const [selectedFont, setSelectedFont] = useState<string>('dancing-script');
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);
  const [affirmationConfirmed, setAffirmationConfirmed] = useState<boolean>(false);
  const [hasAffirmedThisSession, setHasAffirmedThisSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDrawnSignature('');
      setTypedText(recipientName);
      setSelectedFont('dancing-script');
      setSaveAsDefault(false);
      
      // Auto-select saved signatures tab if user has signatures
      if (savedSignatures.length > 0) {
        setActiveTab('saved');
      } else {
        setActiveTab('draw');
      }
    }
  }, [isOpen, recipientName, savedSignatures.length]);

  const handleDrawnSignature = useCallback((dataUrl: string) => {
    setDrawnSignature(dataUrl);
  }, []);

  const handleUseDrawnSignature = async () => {
    if (!drawnSignature) return;

    // Validate affirmation on first signature
    if (!hasAffirmedThisSession && !affirmationConfirmed) {
      toast({
        title: "Affirmation Required",
        description: "Please confirm the e-signature affirmation to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mark as affirmed for this session
      if (!hasAffirmedThisSession) {
        setHasAffirmedThisSession(true);
      }

      // Save signature if requested
      if (onSaveSignature && saveAsDefault) {
        await onSaveSignature('drawn', drawnSignature, undefined, saveAsDefault);
      }

      onSign(drawnSignature, 'drawn');

      // Reset checkbox for potential next signature (but keep session flag)
      setAffirmationConfirmed(false);
      onClose();
    } catch (error) {
      console.error('Error saving drawn signature:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTypedSignature = async () => {
    if (!typedText.trim()) return;

    // Validate affirmation on first signature
    if (!hasAffirmedThisSession && !affirmationConfirmed) {
      toast({
        title: "Affirmation Required",
        description: "Please confirm the e-signature affirmation to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mark as affirmed for this session
      if (!hasAffirmedThisSession) {
        setHasAffirmedThisSession(true);
      }

      // Save signature if requested
      if (onSaveSignature && saveAsDefault) {
        await onSaveSignature('typed', typedText.trim(), selectedFont, saveAsDefault);
      }

      onSign(typedText.trim(), 'typed', selectedFont);

      // Reset checkbox for potential next signature (but keep session flag)
      setAffirmationConfirmed(false);
      onClose();
    } catch (error) {
      console.error('Error saving typed signature:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSavedSignature = (signature: UserSignature) => {
    // Validate affirmation on first signature
    if (!hasAffirmedThisSession && !affirmationConfirmed) {
      toast({
        title: "Affirmation Required",
        description: "Please confirm the e-signature affirmation to continue",
        variant: "destructive",
      });
      return;
    }

    // Mark as affirmed for this session
    if (!hasAffirmedThisSession) {
      setHasAffirmedThisSession(true);
    }

    onSign(signature.data, signature.type, signature.fontFamily);

    // Reset checkbox for potential next signature (but keep session flag)
    setAffirmationConfirmed(false);
    onClose();
  };

  const handleDeleteSignature = async (signatureId: string) => {
    if (!onDeleteSignature) return;
    
    try {
      await onDeleteSignature(signatureId);
    } catch (error) {
      console.error('Error deleting signature:', error);
    }
  };

  const handleSetDefault = async (signatureId: string) => {
    if (!onSetDefaultSignature) return;
    
    try {
      await onSetDefaultSignature(signatureId);
    } catch (error) {
      console.error('Error setting default signature:', error);
    }
  };

  const selectedFontClass = SIGNATURE_FONTS.find(f => f.value === selectedFont)?.className || 'font-signature-dancing';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className='text-center text-base sm:text-lg'>Add Your Signature</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="draw" className="px-2 sm:px-4">Draw</TabsTrigger>
            <TabsTrigger value="type" className="px-2 sm:px-4">Type</TabsTrigger>
            <TabsTrigger value="saved" disabled={savedSignatures.length === 0} className="px-1 sm:px-4">
              <span className="hidden sm:inline">Saved ({savedSignatures.length})</span>
              <span className="sm:hidden">Saved</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3 sm:space-y-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Draw your signature in the area below using your mouse or finger.
            </div>

            <SignatureCanvas
              onSignatureComplete={handleDrawnSignature}
              width={500}
              height={150}
            />

            {onSaveSignature && (
              <BrandCheckbox
                name="save-drawn"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                label="Save this signature for future use"
              />
            )}

            {!hasAffirmedThisSession && (
              <div className="my-6">
                <BrandCheckbox
                  name="esignature-affirmation"
                  checked={affirmationConfirmed}
                  onChange={(e) => setAffirmationConfirmed(e.target.checked)}
                  label="By checking this box, I affirm that the signature above is a legally binding representation of my signature and constitutes my agreement to the terms of this document."
                  required
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button variant="outline" onClick={onClose} className="min-h-[44px] touch-manipulation">
                Cancel
              </Button>
              <BrandButton
                onClick={handleUseDrawnSignature}
                disabled={!drawnSignature || isLoading}
                loading={isLoading}
                className="min-h-[44px] touch-manipulation"
              >
                Use Signature
              </BrandButton>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-3 sm:space-y-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Type your signature and choose a font style.
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="signature-text" className="text-sm">Signature Text</Label>
                <Input
                  id="signature-text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1 min-h-[44px] touch-manipulation"
                />
              </div>

              <div>
                <Label htmlFor="font-select" className="text-sm">Font Style</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger className="mt-1 min-h-[44px] touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNATURE_FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span className={font.className}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-3 sm:p-4 bg-gray-50 min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                <div className={`text-xl sm:text-2xl ${selectedFontClass}`}>
                  {typedText || 'Preview will appear here'}
                </div>
              </div>

              {onSaveSignature && (
                <BrandCheckbox
                  name="save-typed"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  label="Save this signature for future use"
                />
              )}

              {!hasAffirmedThisSession && (
                <div className="my-6">
                  <BrandCheckbox
                    name="esignature-affirmation-typed"
                    checked={affirmationConfirmed}
                    onChange={(e) => setAffirmationConfirmed(e.target.checked)}
                    label="By checking this box, I affirm that the signature above is a legally binding representation of my signature and constitutes my agreement to the terms of this document."
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button variant="outline" onClick={onClose} className="min-h-[44px] touch-manipulation">
                Cancel
              </Button>
              <BrandButton
                onClick={handleUseTypedSignature}
                disabled={!typedText.trim() || isLoading}
                loading={isLoading}
                className="min-h-[44px] touch-manipulation"
              >
                Use Signature
              </BrandButton>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-3 sm:space-y-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Choose from your saved signatures or manage your signature library.
            </div>

            {!hasAffirmedThisSession && (
              <div className="my-6">
                <BrandCheckbox
                  name="esignature-affirmation-saved"
                  checked={affirmationConfirmed}
                  onChange={(e) => setAffirmationConfirmed(e.target.checked)}
                  label="By checking this box, I affirm that the signature I select is a legally binding representation of my signature and constitutes my agreement to the terms of this document."
                  required
                />
              </div>
            )}

            <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {savedSignatures.map((signature) => (
                <div
                  key={signature.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      {signature.type === 'drawn' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <img
                            src={signature.data}
                            alt="Saved signature"
                            className="h-12 sm:h-16 max-w-[160px] sm:max-w-[200px] object-contain border rounded mx-auto sm:mx-0"
                          />
                          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                            Drawn signature
                            {signature.isDefault && (
                              <span className="ml-2 text-yellow-600">(Default)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className={`text-lg sm:text-xl ${SIGNATURE_FONTS.find(f => f.value === signature.fontFamily)?.className || 'font-signature-dancing'} border rounded px-3 sm:px-4 py-2 bg-white min-w-[160px] sm:min-w-[200px] text-center`}>
                            {signature.data}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                            <div>Typed signature</div>
                            <div className="hidden sm:block">({SIGNATURE_FONTS.find(f => f.value === signature.fontFamily)?.label || 'Dancing Script'})</div>
                            {signature.isDefault && (
                              <span className="text-yellow-600">(Default)</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      {onSetDefaultSignature && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(signature.id)}
                          title={signature.isDefault ? "Remove default" : "Set as default"}
                          className="min-h-[44px] min-w-[44px] touch-manipulation"
                        >
                          {signature.isDefault ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      )}

                      {onDeleteSignature && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSignature(signature.id)}
                          className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] touch-manipulation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <BrandButton
                        size="sm"
                        onClick={() => handleUseSavedSignature(signature)}
                        className="min-h-[44px] touch-manipulation"
                      >
                        Use
                      </BrandButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose} className="min-h-[44px] touch-manipulation">
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

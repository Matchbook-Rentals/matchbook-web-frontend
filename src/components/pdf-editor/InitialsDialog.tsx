'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Star, StarOff } from 'lucide-react';
import { SIGNATURE_FONTS } from './signature-fonts';

interface InitialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (initials: string, type: 'typed', fontFamily?: string) => void;
  recipientName: string;
  currentInitials?: string; // Current user's saved initials
  onSaveInitials?: (initials: string) => Promise<void>; // Save initials to user.signingInitials
}

export const InitialsDialog: React.FC<InitialsDialogProps> = ({
  isOpen,
  onClose,
  onSign,
  recipientName,
  currentInitials,
  onSaveInitials,
}) => {
  const [typedText, setTypedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const selectedFont = 'dancing-script'; // Default font only

  // Generate initials from recipient name
  const generateInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3); // Limit to 3 characters max
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Generate initials from name (only shown when currentInitials is null)
      const initials = generateInitials(recipientName);
      setTypedText(initials);
    }
  }, [isOpen, recipientName]);

  const selectedFontClass = SIGNATURE_FONTS.find(f => f.value === selectedFont)?.className || 'font-signature-dancing';

  const handleUseTypedInitials = async () => {
    if (!typedText.trim()) return;

    console.log('🔤 InitialsDialog - Starting to save initials:', {
      initials: typedText.trim(),
      hasOnSaveInitials: !!onSaveInitials,
      recipientName: recipientName
    });

    setIsLoading(true);
    try {
      // ALWAYS save initials - no choice for first-time users
      if (onSaveInitials) {
        console.log('🔤 InitialsDialog - Calling onSaveInitials with:', typedText.trim());
        await onSaveInitials(typedText.trim());
        console.log('🔤 InitialsDialog - Successfully saved initials');
      } else {
        console.log('🔤 InitialsDialog - No onSaveInitials function provided');
      }

      console.log('🔤 InitialsDialog - Calling onSign with initials');
      onSign(typedText.trim(), 'typed', selectedFont);
      onClose();
    } catch (error) {
      console.error('🔤 InitialsDialog - Error saving typed initials:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className='text-center text-base sm:text-lg'>Add Your Initials</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="text-xs sm:text-sm text-gray-600">
            Enter your initials below. They will be styled with a signature font.
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="initials-text" className="text-sm">Your Initials</Label>
              <Input
                id="initials-text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value.toUpperCase().substring(0, 3))}
                placeholder="Enter initials"
                className={`mt-1 text-center text-2xl min-h-[44px] touch-manipulation ${selectedFontClass}`}
                maxLength={3}
              />
            </div>

            {/* Preview */}
            <div className="border-2 border-brand-teal rounded-lg p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
              <div className={`text-4xl sm:text-5xl ${selectedFontClass}`}>
                {typedText || 'AB'}
              </div>
            </div>

            <div className="text-xs sm:text-sm text-gray-600 text-center">
              These initials will be saved to your profile for future use.
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="min-h-[44px] touch-manipulation">
              Cancel
            </Button>
            <BrandButton
              onClick={handleUseTypedInitials}
              disabled={!typedText.trim() || isLoading}
              loading={isLoading}
              className="min-h-[44px] touch-manipulation"
            >
              Use Initials
            </BrandButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

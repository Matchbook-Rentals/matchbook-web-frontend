'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import BrandModal from '@/components/BrandModal';
import { BrandButton } from '@/components/ui/brandButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignatureCanvas, type SignatureCanvasHandle } from './SignatureCanvas';
import { Trash2 } from 'lucide-react';
import { SIGNATURE_FONTS } from './signature-fonts';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { setCachedSignature } from './signatureCache';

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
  /** Scope key for the client-side signature cache (e.g. recipient email). */
  cacheScope?: string;
  // Props kept for backward compatibility — server-backed saved-signature flow has been removed.
  savedSignatures?: UserSignature[];
  onSaveSignature?: (type: 'drawn' | 'typed', data: string, fontFamily?: string, setAsDefault?: boolean) => Promise<void>;
  onDeleteSignature?: (id: string) => Promise<void>;
  onSetDefaultSignature?: (id: string) => Promise<void>;
}

type SignatureMode = 'draw' | 'type';

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  onClose,
  onSign,
  recipientName,
  cacheScope,
}) => {
  const [mode, setMode] = useState<SignatureMode>('type');
  const [drawnSignature, setDrawnSignature] = useState<string>('');
  const [typedText, setTypedText] = useState<string>(recipientName);
  const [selectedFont, setSelectedFont] = useState<string>('dancing-script');
  const [affirmationConfirmed, setAffirmationConfirmed] = useState<boolean>(false);
  const [hasAffirmedThisSession, setHasAffirmedThisSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<SignatureCanvasHandle>(null);

  useEffect(() => {
    if (isOpen) {
      setDrawnSignature('');
      setTypedText(recipientName);
      setSelectedFont('dancing-script');
      setMode('type');
    }
  }, [isOpen, recipientName]);

  const handleDrawnSignature = useCallback((dataUrl: string) => {
    setDrawnSignature(dataUrl);
  }, []);

  const requireAffirmation = (): boolean => {
    if (hasAffirmedThisSession || affirmationConfirmed) return true;
    toast({
      title: 'Affirmation Required',
      description: 'Please confirm the e-signature affirmation to continue',
      variant: 'destructive',
    });
    return false;
  };

  const handleSign = async () => {
    if (mode === 'draw') {
      if (!drawnSignature) return;
      if (!requireAffirmation()) return;

      setIsLoading(true);
      try {
        if (!hasAffirmedThisSession) setHasAffirmedThisSession(true);
        setCachedSignature({ value: drawnSignature, type: 'drawn' }, cacheScope);
        onSign(drawnSignature, 'drawn');
        setAffirmationConfirmed(false);
        onClose();
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!typedText.trim()) return;
    if (!requireAffirmation()) return;

    setIsLoading(true);
    try {
      if (!hasAffirmedThisSession) setHasAffirmedThisSession(true);
      setCachedSignature({ value: typedText.trim(), type: 'typed', fontFamily: selectedFont }, cacheScope);
      onSign(typedText.trim(), 'typed', selectedFont);
      setAffirmationConfirmed(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFontClass = SIGNATURE_FONTS.find(f => f.value === selectedFont)?.className || 'font-signature-dancing';
  const canSign = mode === 'draw' ? !!drawnSignature : !!typedText.trim();

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      className="max-w-[95vw] sm:max-w-xl max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
      heightStyle="!top-[10vh] sm:!top-[15vh] sm:!translate-y-0"
    >
        <h2 className="text-base sm:text-lg font-semibold text-[#020202]">Add Your Signature</h2>

        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">Select Signature type</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode('type')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'type'
                  ? 'border border-primaryBrand text-primaryBrand bg-primaryBrand/5'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Type
            </button>
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                mode === 'draw'
                  ? 'border border-primaryBrand text-primaryBrand bg-primaryBrand/5'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Draw
            </button>
          </div>
        </div>

        {mode === 'draw' ? (
          <div className="relative border rounded-2xl bg-gray-50/50 px-4 py-2">
            <SignatureCanvas
              ref={canvasRef}
              onSignatureComplete={handleDrawnSignature}
              width={500}
              height={150}
              hideControls
            />
            <button
              type="button"
              onClick={() => canvasRef.current?.clear()}
              disabled={!drawnSignature}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:hover:text-gray-500"
              aria-label="Clear signature"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="signature-text" className="text-xs">Signature Text</Label>
              <Input
                id="signature-text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 h-9 text-sm touch-manipulation"
              />
            </div>

            <div>
              <Label htmlFor="font-select" className="text-xs">Font Style</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger className="mt-1 h-9 text-sm touch-manipulation">
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

            <div className="border rounded-2xl bg-gray-50/50 min-h-[90px] flex items-center justify-center px-4 py-3">
              <div className={`text-xl sm:text-2xl ${selectedFontClass}`}>
                {typedText || 'Preview will appear here'}
              </div>
            </div>
          </div>
        )}

        {!hasAffirmedThisSession && (
          <BrandCheckbox
            name="esignature-affirmation"
            checked={affirmationConfirmed}
            onChange={(e) => setAffirmationConfirmed(e.target.checked)}
            label={
              <span className="text-xs font-medium text-[#020202]">
                By checking this box, I affirm that the signature I select is a legally binding representation of my signature and constitutes my agreement to the terms of this document
              </span>
            }
            required
          />
        )}

        <div className="flex justify-end gap-2">
          <BrandButton
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </BrandButton>
          <BrandButton
            onClick={handleSign}
            disabled={!canSign || isLoading}
            loading={isLoading}
            size="sm"
          >
            Sign
          </BrandButton>
        </div>
    </BrandModal>
  );
};

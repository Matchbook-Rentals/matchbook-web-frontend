'use client';

import { BrandButton } from '@/components/ui/brandButton';

interface BookingFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
}

export function BookingFooter({ onBack, onContinue, backLabel = 'Back', continueLabel = 'Continue' }: BookingFooterProps) {
  return (
    <footer className="booking-review__footer">
      <BrandButton variant="tertiary" onClick={onBack}>{backLabel}</BrandButton>
      <BrandButton variant="default" onClick={onContinue}>{continueLabel}</BrandButton>
    </footer>
  );
}

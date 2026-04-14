'use client';

import { BrandButton } from '@/components/ui/brandButton';
import { useBookingStepFooterStore } from '@/stores/booking-step-footer-store';

interface BookingFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
}

export function BookingFooter({ onBack, onContinue, backLabel = 'Back', continueLabel = 'Continue' }: BookingFooterProps) {
  const override = useBookingStepFooterStore((s) => s.override);
  const effectiveLabel = override?.continueLabel ?? continueLabel;
  const effectiveHandler = override?.continueHandler ?? onContinue;
  const effectiveDisabled = override?.continueDisabled ?? false;

  return (
    <footer className="booking-review__footer">
      <BrandButton variant="tertiary" onClick={onBack}>{backLabel}</BrandButton>
      <BrandButton
        variant="default"
        onClick={effectiveHandler}
        disabled={effectiveDisabled}
      >
        {effectiveLabel}
      </BrandButton>
    </footer>
  );
}

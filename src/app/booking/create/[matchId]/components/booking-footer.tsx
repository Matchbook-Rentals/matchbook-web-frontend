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
  const effectiveLabel = override?.nextStepButtonText ?? continueLabel;
  const effectiveHandler = override?.nextStepButtonAction ?? onContinue;
  const effectiveDisabled = override?.nextStepButtonDisabled ?? false;
  const effectiveLoading = override?.nextStepButtonLoading ?? false;

  return (
    <footer className="booking-review__footer">
      <BrandButton variant="tertiary" onClick={onBack}>{backLabel}</BrandButton>
      <BrandButton
        variant="default"
        onClick={effectiveHandler}
        disabled={effectiveDisabled}
        isLoading={effectiveLoading}
      >
        {effectiveLabel}
      </BrandButton>
    </footer>
  );
}

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
  const footerHint = override?.footerHint;

  return (
    <footer className="booking-review__footer">
      <div className="flex items-center gap-4 min-w-0">
        {onBack && (
          <BrandButton variant="tertiary" onClick={onBack}>{backLabel}</BrandButton>
        )}
        {footerHint && (
          <div className="hidden md:flex items-center text-sm text-gray-600 min-w-0 truncate">
            {footerHint}
          </div>
        )}
      </div>
      {effectiveHandler && (
        <BrandButton
          variant="default"
          onClick={effectiveHandler}
          disabled={effectiveDisabled}
          isLoading={effectiveLoading}
        >
          {effectiveLabel}
        </BrandButton>
      )}
    </footer>
  );
}

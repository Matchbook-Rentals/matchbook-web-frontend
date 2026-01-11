import React from "react";
import { BrandButton } from "@/components/ui/brandButton";

interface VerificationFooterProps {
  primaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
    variant?: "outline" | "ghost";
  };
}

export const VerificationFooter = ({
  primaryButton,
  secondaryButton,
}: VerificationFooterProps): JSX.Element => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 shadow-lg z-50">
      <div className="pl-2 pr-2 md:pl-12 md:pr-12 py-4 flex justify-between items-center gap-3">
        {secondaryButton ? (
          <BrandButton
            type="button"
            variant={secondaryButton.variant || "outline"}
            size="lg"
            onClick={secondaryButton.onClick}
            data-testid="verification-secondary-button"
          >
            {secondaryButton.label}
          </BrandButton>
        ) : (
          <div />
        )}

        {primaryButton && (
          <BrandButton
            type="button"
            size="lg"
            onClick={primaryButton.onClick}
            disabled={primaryButton.disabled}
            data-testid="verification-primary-button"
          >
            {primaryButton.loading ? "Processing..." : primaryButton.label}
          </BrandButton>
        )}
      </div>
    </div>
  );
};

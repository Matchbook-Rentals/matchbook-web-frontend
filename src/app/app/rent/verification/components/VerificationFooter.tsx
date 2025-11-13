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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-4 flex justify-between items-center gap-3">
        {secondaryButton ? (
          <BrandButton
            type="button"
            variant={secondaryButton.variant || "outline"}
            size="lg"
            onClick={secondaryButton.onClick}
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
          >
            {primaryButton.loading ? "Processing..." : primaryButton.label}
          </BrandButton>
        )}
      </div>
    </div>
  );
};

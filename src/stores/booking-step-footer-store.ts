import { useEffect, useRef } from 'react';
import { create } from 'zustand';

export interface FooterOverride {
  nextStepButtonText?: string;
  nextStepButtonAction?: () => void | Promise<void>;
  nextStepButtonDisabled?: boolean;
  nextStepButtonLoading?: boolean;
}

interface BookingStepFooterState {
  override: FooterOverride | null;
  setOverride: (override: FooterOverride | null) => void;
}

export const useBookingStepFooterStore = create<BookingStepFooterState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));

/**
 * Step components use this to control the outer BookingFooter's Continue button.
 *
 * Takes primitive text + disabled flag (stable deps) and an action function.
 * The action is kept in a ref so the registered handler always invokes the
 * latest closure without re-registering the override every render.
 *
 * Automatically clears the override on unmount.
 */
export function useBookingFooterControl({
  nextStepButtonText,
  nextStepButtonDisabled,
  nextStepButtonLoading,
  nextStepButtonAction,
}: {
  nextStepButtonText?: string;
  nextStepButtonDisabled?: boolean;
  nextStepButtonLoading?: boolean;
  nextStepButtonAction?: () => void | Promise<void>;
}) {
  const setOverride = useBookingStepFooterStore((s) => s.setOverride);

  const actionRef = useRef(nextStepButtonAction);
  actionRef.current = nextStepButtonAction;

  useEffect(() => {
    setOverride({
      nextStepButtonText,
      nextStepButtonDisabled,
      nextStepButtonLoading,
      nextStepButtonAction: () => actionRef.current?.(),
    });
  }, [nextStepButtonText, nextStepButtonDisabled, nextStepButtonLoading, setOverride]);

  useEffect(() => {
    return () => setOverride(null);
  }, [setOverride]);
}

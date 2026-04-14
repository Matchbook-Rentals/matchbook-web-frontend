import { useEffect, useRef, type ReactNode } from 'react';
import { create } from 'zustand';

export interface FooterOverride {
  nextStepButtonText?: string;
  nextStepButtonAction?: () => void | Promise<void>;
  nextStepButtonDisabled?: boolean;
  nextStepButtonLoading?: boolean;
  /** Optional hint rendered to the right of the Back button */
  footerHint?: ReactNode;
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
  footerHint,
}: {
  nextStepButtonText?: string;
  nextStepButtonDisabled?: boolean;
  nextStepButtonLoading?: boolean;
  nextStepButtonAction?: () => void | Promise<void>;
  footerHint?: ReactNode;
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
      footerHint,
    });
  }, [nextStepButtonText, nextStepButtonDisabled, nextStepButtonLoading, footerHint, setOverride]);

  useEffect(() => {
    return () => setOverride(null);
  }, [setOverride]);
}

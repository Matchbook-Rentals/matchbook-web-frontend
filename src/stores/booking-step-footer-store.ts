import { create } from 'zustand';

export interface FooterOverride {
  continueLabel?: string;
  continueHandler?: () => void | Promise<void>;
  continueDisabled?: boolean;
}

interface BookingStepFooterState {
  override: FooterOverride | null;
  setOverride: (override: FooterOverride | null) => void;
}

export const useBookingStepFooterStore = create<BookingStepFooterState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));

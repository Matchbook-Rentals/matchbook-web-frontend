import { create } from 'zustand';

interface VisibleListingsStore {
  visibleListingIds: string[];
  setVisibleListingIds: (ids: string[]) => void;
}

export const useVisibleListingsStore = create<VisibleListingsStore>((set: (partial: Partial<VisibleListingsStore>) => void) => ({
  visibleListingIds: [],
  setVisibleListingIds: (ids: string[]) => set({ visibleListingIds: ids })
}));
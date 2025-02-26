import { create } from 'zustand';

interface VisibleListingsStore {
  visibleListingIds: string[] | null;
  setVisibleListingIds: (ids: string[] | null) => void;
}

export const useVisibleListingsStore = create<VisibleListingsStore>((set: (partial: Partial<VisibleListingsStore>) => void) => ({
  visibleListingIds: null,
  setVisibleListingIds: (ids: string[] | null) => set({ visibleListingIds: ids })
}));
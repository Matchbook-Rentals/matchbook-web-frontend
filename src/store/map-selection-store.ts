import { create } from 'zustand';
import { ListingAndImages } from '@/types';

export interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string; // Optional for mobile/desktop
  listing: ListingAndImages & {
    user: {
      imageUrl: string;
      fullName: string;
      createdAt: Date;
    };
    isLiked?: boolean; // Added for marker coloring
    isDisliked?: boolean; // Added for marker coloring
  };
}

interface MapSelectionState {
  selectedMarker: MapMarker | null;
  // Allow function updater to toggle
  setSelectedMarker: (
    marker: MapMarker | null | ((prev: MapMarker | null) => MapMarker | null)
  ) => void;
}

export const useMapSelectionStore = create<MapSelectionState>((set) => ({
  selectedMarker: null,
  setSelectedMarker: (marker) => {
    if (typeof marker === 'function') {
      set((state) => ({
        selectedMarker: marker(state.selectedMarker)
      }));
    } else {
      set({ selectedMarker: marker });
    }
  }
}));
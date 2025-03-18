import { create } from 'zustand';

interface MapFullscreenState {
  isMapFullscreen: boolean;
  setMapFullscreen: (isFullscreen: boolean) => void;
}

export const useMapFullscreenStore = create<MapFullscreenState>((set) => ({
  isMapFullscreen: false,
  setMapFullscreen: (isFullscreen) => set({ isMapFullscreen: isFullscreen }),
}));
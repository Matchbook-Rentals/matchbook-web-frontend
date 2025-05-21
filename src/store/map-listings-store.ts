import { create } from 'zustand';
import { ListingAndImages } from '@/types';
import { MapMarker } from './map-selection-store';

/**
 * This store is the source of truth for map data and listings.
 * It maintains its own state to prevent re-renders and flashing.
 */
interface MapListingsState {
  // Map state
  mapCenter: [number, number];
  initialCenter: [number, number];
  zoom: number;
  isFullscreen: boolean;
  
  // Listings state
  allListings: MapMarker[];
  visibleListingIds: string[] | null;
  likedListingIds: Set<string>;
  dislikedListingIds: Set<string>;
  requestedListingIds: Set<string>;
  
  // Setters
  setMapCenter: (center: [number, number]) => void;
  setInitialCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setAllListings: (listings: MapMarker[]) => void;
  setVisibleListingIds: (ids: string[] | null) => void;
  
  // Direct ID operations
  addLikedId: (listingId: string) => void;
  removeLikedId: (listingId: string) => void;
  addDislikedId: (listingId: string) => void;
  removeDislikedId: (listingId: string) => void;
  addRequestedId: (listingId: string) => void;
  removeRequestedId: (listingId: string) => void;
  
  // Action handlers
  toggleLikeListing: (listingId: string) => void;
  toggleDislikeListing: (listingId: string) => void;
  
  // Computed data
  getVisibleListings: () => MapMarker[];
  getLikedListings: () => MapMarker[];
  getDislikedListings: () => MapMarker[];
  getRequestedListings: () => MapMarker[];
  getListingStatus: (listingId: string) => 'liked' | 'disliked' | 'requested' | 'none';
  
  // Utility methods
  getListingById: (listingId: string) => MapMarker | undefined;
  resetVisibleListings: () => void;
}

export const useMapListingsStore = create<MapListingsState>((set, get) => ({
  // Initial state
  mapCenter: [0, 0],
  initialCenter: [0, 0],
  zoom: 12,
  isFullscreen: false,
  allListings: [],
  visibleListingIds: null,
  likedListingIds: new Set<string>(),
  dislikedListingIds: new Set<string>(),
  requestedListingIds: new Set<string>(),
  
  // Setters
  setMapCenter: (center) => set({ mapCenter: center }),
  setInitialCenter: (center) => set({ initialCenter: center }),
  setZoom: (zoom) => set({ zoom }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setAllListings: (listings) => set({ allListings: listings }),
  setVisibleListingIds: (ids) => set({ visibleListingIds: ids }),
  
  // Direct ID operations
  addLikedId: (listingId) => set((state) => {
    const newLikedIds = new Set(state.likedListingIds);
    newLikedIds.add(listingId);
    return { likedListingIds: newLikedIds };
  }),
  
  removeLikedId: (listingId) => set((state) => {
    const newLikedIds = new Set(state.likedListingIds);
    newLikedIds.delete(listingId);
    return { likedListingIds: newLikedIds };
  }),
  
  addDislikedId: (listingId) => set((state) => {
    const newDislikedIds = new Set(state.dislikedListingIds);
    newDislikedIds.add(listingId);
    return { dislikedListingIds: newDislikedIds };
  }),
  
  removeDislikedId: (listingId) => set((state) => {
    const newDislikedIds = new Set(state.dislikedListingIds);
    newDislikedIds.delete(listingId);
    return { dislikedListingIds: newDislikedIds };
  }),
  
  addRequestedId: (listingId) => set((state) => {
    const newRequestedIds = new Set(state.requestedListingIds);
    newRequestedIds.add(listingId);
    return { requestedListingIds: newRequestedIds };
  }),
  
  removeRequestedId: (listingId) => set((state) => {
    const newRequestedIds = new Set(state.requestedListingIds);
    newRequestedIds.delete(listingId);
    return { requestedListingIds: newRequestedIds };
  }),
  
  // Action handlers
  toggleLikeListing: (listingId) => {
    set((state) => {
      const newLikedIds = new Set(state.likedListingIds);
      const newDislikedIds = new Set(state.dislikedListingIds);
      
      if (newLikedIds.has(listingId)) {
        // Unlike
        newLikedIds.delete(listingId);
      } else {
        // Like and remove any dislike
        newLikedIds.add(listingId);
        newDislikedIds.delete(listingId);
      }
      
      return {
        likedListingIds: newLikedIds,
        dislikedListingIds: newDislikedIds
      };
    });
  },
  
  toggleDislikeListing: (listingId) => {
    set((state) => {
      const newLikedIds = new Set(state.likedListingIds);
      const newDislikedIds = new Set(state.dislikedListingIds);
      
      if (newDislikedIds.has(listingId)) {
        // Undislike
        newDislikedIds.delete(listingId);
      } else {
        // Dislike and remove any like
        newDislikedIds.add(listingId);
        newLikedIds.delete(listingId);
      }
      
      return {
        likedListingIds: newLikedIds,
        dislikedListingIds: newDislikedIds
      };
    });
  },
  
  // Computed getters
  getVisibleListings: () => {
    const { allListings, visibleListingIds } = get();
    
    if (!visibleListingIds) {
      return allListings;
    }
    
    return allListings.filter(marker => 
      visibleListingIds.includes(marker.listing.id)
    );
  },
  
  getLikedListings: () => {
    const { allListings, likedListingIds } = get();
    return allListings.filter(marker => 
      likedListingIds.has(marker.listing.id)
    );
  },
  
  getDislikedListings: () => {
    const { allListings, dislikedListingIds } = get();
    return allListings.filter(marker => 
      dislikedListingIds.has(marker.listing.id)
    );
  },
  
  getRequestedListings: () => {
    const { allListings, requestedListingIds } = get();
    return allListings.filter(marker => 
      requestedListingIds.has(marker.listing.id)
    );
  },
  
  getListingStatus: (listingId) => {
    const { likedListingIds, dislikedListingIds, requestedListingIds } = get();
    
    if (likedListingIds.has(listingId)) return 'liked';
    if (dislikedListingIds.has(listingId)) return 'disliked';
    if (requestedListingIds.has(listingId)) return 'requested';
    return 'none';
  },
  
  // Utility methods
  getListingById: (listingId) => {
    const { allListings } = get();
    return allListings.find(marker => marker.listing.id === listingId);
  },
  
  resetVisibleListings: () => {
    set({ visibleListingIds: null });
  }
}));
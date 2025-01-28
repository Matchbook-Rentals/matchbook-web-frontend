import { create } from 'zustand'
import { ListingAndImages } from '@/types'

interface ListingHoverState {
  hoveredListing: ListingAndImages | null
  setHoveredListing: (listing: ListingAndImages | null) => void
  panToLocation: (lat: number, lng: number) => void
  shouldPanTo: { lat: number, lng: number } | null
  clearPanTo: () => void
}

export const useListingHoverStore = create<ListingHoverState>((set) => ({
  hoveredListing: null,
  shouldPanTo: null,
  setHoveredListing: (listing) => set((state) => ({
    hoveredListing: listing,
    shouldPanTo: listing ? { lat: listing.latitude, lng: listing.longitude } : null
  })),
  panToLocation: (lat, lng) => set({ shouldPanTo: { lat, lng } }),
  clearPanTo: () => set({ shouldPanTo: null })
}))
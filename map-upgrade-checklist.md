# Map Upgrade Checklist

This document tracks progress on the map component decoupling project. Each step includes specific file paths and functionality expectations.

## Project Objective

Decouple the map components from TripContext to prevent unnecessary re-renders, while maintaining proper state management and user experience.

## Implementation Checklist

- [x] **1. Initial Context Split and Hook Creation**
  - [x] Create `TripStateContext` and `TripActionsContext` in `/src/contexts/trip-state-context.ts` and `/src/contexts/trip-actions-context.ts`
  - [x] Implement `useTripSnapshot` hook in `/src/hooks/useTripSnapshot.ts`
  - [x] Implement `useTripActions` hook in `/src/hooks/useTripActions.ts`
  - [x] Ensure original TripContext still functions without breaking changes in `/src/contexts/trip-context-provider.tsx`

- [ ] **2. Map Component Local State Implementation**
  - [ ] Implement local state management in `/src/app/app/searches/(components)/search-map-refactored.tsx`
  - [ ] Add optimistic updates for like/dislike actions
  - [ ] Ensure local state syncs with global state when needed
  - [ ] Create map selection store in `/src/store/map-selection-store.ts`

- [ ] **3. Search Map Component Refactoring**
  - [ ] Refactor main search map in `/src/app/app/searches/(components)/search-map-refactored.tsx`
  - [ ] Update map to use snapshot + actions pattern
  - [ ] Ensure map doesn't reset position/zoom on state changes
  - [ ] Add performance metrics tracking

- [ ] **4. Mobile Map Optimization**
  - [ ] Refactor mobile map in `/src/app/app/searches/(components)/search-map-mobile.tsx`
  - [ ] Optimize touch interactions
  - [ ] Ensure position stability during mobile interactions
  - [ ] Update mobile-specific UI components

- [ ] **5. Map Click Card Refactoring**
  - [ ] Refactor desktop map click card in `/src/app/app/searches/(components)/desktop-map-click-card-refactored.tsx`
  - [ ] Refactor mobile map click card in `/src/app/app/searches/(components)/mobile-map-click-listing-card.tsx`
  - [ ] Ensure visual consistency between desktop and mobile
  - [ ] Update hover store in `/src/store/listing-hover-store.ts`

- [ ] **6. Performance Optimizations and Memoization**
  - [ ] Add React.memo to heavy map components
  - [ ] Optimize render performance for large listing sets
  - [ ] Add performance measurement in key components
  - [ ] Implement proper dependency arrays for hooks

- [ ] **7. Error Handling and Edge Cases**
  - [ ] Add error handling for API failures in map components
  - [ ] Implement graceful handling of empty listing sets
  - [ ] Handle edge cases like rapid likes/dislikes
  - [ ] Add proper error state UI components

- [ ] **8. Clean Up Legacy Context Usage**
  - [ ] Remove all direct usages of old TripContext in map components
  - [ ] Standardize context usage patterns across components
  - [ ] Verify no regressions in functionality
  - [ ] Update relevant imports in all refactored files

- [ ] **9. Full Integration Verification**
  - [ ] Verify integration with other app components
  - [ ] Verify edge cases and error states
  - [ ] Measure final performance improvements
  - [ ] Document architecture changes

## Final Validation Checklist

Before considering the project complete, verify that:

- [ ] Liking/disliking a listing NEVER causes the map to flash or reset
- [ ] Map position and zoom remain stable during all interactions
- [ ] Trip state remains the single source of truth
- [ ] Map holds a local, eventually-consistent copy of relevant state
- [ ] Performance metrics show improvement (reduced render counts, time)
- [ ] Mobile experience is smooth and stable
- [ ] No regressions in functionality from the migration
- [ ] Code is clean, well-documented, and maintainable

## Expected End State

- Liking a listing never causes the map to flash or reset
- Trip-wide state remains the single source of truth
- Map holds a local, eventually-consistent copy of state
- Future features can reuse the snapshot + actions pattern
- User experience is smooth and responsive, especially on mobile
- Performance metrics show significant improvement
- Architecture is more maintainable and scalable
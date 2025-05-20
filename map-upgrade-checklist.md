# Map Upgrade Checklist

This document outlines the specific commit points and functionality expectations for the map component decoupling project. Each commit point includes specific tests and functionality expectations that should be working before moving to the next point.

## Project Objective

Decouple the map components from TripContext to prevent unnecessary re-renders, while maintaining proper state management and user experience. This will:
- Improve performance by preventing map resets when liking/disliking listings
- Create a more maintainable context architecture 
- Provide a better user experience especially on mobile devices

## Commit Points and Functionality Expectations

### 1. Initial Context Split and Hook Creation

**Commit:** "Initial context split and hook creation for map decoupling"

**Expected functionality:**
- New `TripStateContext` and `TripActionsContext` should be defined
- `useTripSnapshot` hook should be implemented to get one-time state snapshot
- `useTripActions` hook should be implemented to get stable action references
- Original TripContext should still function without any breaking changes
- No UI changes should be visible to users at this point

**Tests:**
```tsx
// Test that useTripSnapshot returns a static snapshot that doesn't update
test('useTripSnapshot should return a static snapshot that does not update on state changes', () => {
  // Render a component with useTripSnapshot
  // Trigger state changes
  // Verify the snapshot doesn't update
})

// Test that useTripActions provides stable references
test('useTripActions should provide stable function references across renders', () => {
  // Render a component with useTripActions 
  // Force re-renders
  // Verify action function references remain the same
})
```

### 2. Map Component Local State Implementation

**Commit:** "Add local state management to map components"

**Expected functionality:**
- Map components should maintain their own local copy of listings
- Map components should update listings optimistically on user actions
- Components should dispatch actions to the global state while maintaining local state
- Map component should not re-render when Trip state changes elsewhere
- Map visual state should remain stable during operations

**Tests:**
```tsx
// Test that map keeps local state without re-rendering on Trip state changes
test('Map component should maintain local state without re-rendering on Trip state changes', () => {
  // Render map component
  // Trigger Trip state changes elsewhere
  // Verify map component doesn't re-render
})

// Test optimistic updates on like/dislike
test('Map component should update listing likes optimistically', () => {
  // Render map component
  // Trigger like action
  // Verify local state updates immediately without waiting for global state
})
```

### 3. Search Map Component Refactoring

**Commit:** "Refactor search-map component to use local state management"

**Expected functionality:**
- The search map should use the new context architecture
- Liking/disliking a listing should NOT reset map position or zoom
- Map markers should update visually on like/dislike without full re-render
- Performance should be noticeably improved especially with many listings
- Map should correctly reflect global state after unmounting and remounting

**E2E Test:**
```typescript
// e2e/map-stability.spec.ts
test('Map should maintain position and zoom when liking/disliking listings', async ({ page }) => {
  // Navigate to search page with map
  await page.goto('/platform/searches');
  
  // Get initial map state
  const initialCenter = await page.evaluate(() => {
    // Get map center coordinates
    return document.querySelector('.map-container').getAttribute('data-center');
  });
  
  // Like a listing
  await page.click('.listing-card:first-child .like-button');
  
  // Check map state hasn't changed
  const newCenter = await page.evaluate(() => {
    return document.querySelector('.map-container').getAttribute('data-center');
  });
  
  expect(newCenter).toBe(initialCenter);
})
```

### 4. Mobile Map Optimization

**Commit:** "Optimize mobile map component with local state management"

**Expected functionality:**
- Mobile search map should use the new context pattern
- Mobile map should maintain position during interactions
- Touch interactions on the map should not trigger unnecessary re-renders
- Mobile map should be significantly more stable and responsive
- Mobile-specific UI interactions should work smoothly with the map

**E2E Test:**
```typescript
// e2e/map-stability.spec.ts
test('Mobile map should maintain stability during interactions', async ({ page, isMobile }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  
  // Navigate to search page with map on mobile
  await page.goto('/platform/searches');
  
  // Get initial map state
  const initialCenter = await page.evaluate(() => {
    return document.querySelector('.map-container').getAttribute('data-center');
  });
  
  // Interact with a listing
  await page.click('.mobile-listing-card:first-child');
  
  // Like a listing
  await page.click('.like-button-mobile');
  
  // Check map state hasn't changed
  const newCenter = await page.evaluate(() => {
    return document.querySelector('.map-container').getAttribute('data-center');
  });
  
  expect(newCenter).toBe(initialCenter);
})
```

### 5. Map Click Card Refactoring

**Commit:** "Refactor desktop and mobile map click cards to use local state"

**Expected functionality:**
- Map click cards should use the new context pattern
- Clicking a map marker should show details without moving the map
- Liking a listing from the click card should update immediately
- Clicking between markers should be smooth without map resets
- Desktop and mobile click cards should be visually consistent

**Tests:**
```tsx
// Test that map click cards update optimistically
test('Map click cards should update optimistically on like/dislike', () => {
  // Render map with click card
  // Like a listing from click card
  // Verify card updates without waiting for global state
})
```

### 6. Performance Optimizations and Memoization

**Commit:** "Add performance optimizations and memoization to map components"

**Expected functionality:**
- Heavy map subtrees should be memoized to prevent unnecessary re-renders
- Map render performance should be improved with React.memo where appropriate
- Large listing sets (50+ listings) should render smoothly
- Performance metrics should show reduced render counts and time
- User experience should be smoother overall

**Tests:**
```tsx
// Test that map components use proper memoization
test('Map components should use proper memoization to prevent unnecessary re-renders', () => {
  // Set up render counting
  // Render map with many listings
  // Trigger state changes
  // Verify render count is minimized
})
```

### 7. Error Handling and Edge Cases

**Commit:** "Add error handling and edge case management to map components"

**Expected functionality:**
- Optimistic UI updates should revert properly if API calls fail
- Map should handle empty listing sets gracefully
- Edge cases like rapid likes/dislikes should be handled correctly
- Error states should be communicated to the user when appropriate
- Recovery from errors should be smooth and automatic where possible

**Tests:**
```tsx
// Test error handling on API failure
test('Map should revert optimistic updates if API calls fail', async () => {
  // Mock API failure
  // Trigger like action
  // Verify optimistic update happens
  // Verify state reverts after API failure
})
```

### 8. Clean Up Legacy Context Usage

**Commit:** "Remove legacy context dependencies from refactored components"

**Expected functionality:**
- All map-related components should use the new context pattern
- No direct usages of the old TripContext in map components
- Consistent context usage patterns across map components
- No regressions in functionality from the migration
- All tests should continue to pass

**Tests:**
```tsx
// Test that no legacy context is being used
test('No map components should use legacy TripContext', () => {
  // Check for imports of old context
  // Verify all components use new hooks
})
```

### 9. Full Integration Testing and Verification

**Commit:** "Complete map component decoupling with full test coverage"

**Expected functionality:**
- All map components should function correctly with the new architecture
- Integration with other parts of the app should be seamless
- Edge cases and error states should be handled properly
- Performance metrics should show significant improvement
- User experience should be noticeably smoother

**E2E Test:**
```typescript
// e2e/map-stability.spec.ts
test('Full map workflows should function correctly with new architecture', async ({ page }) => {
  // Navigate to search page
  await page.goto('/platform/searches');
  
  // Test full workflow
  // 1. Navigate to map tab
  // 2. Interact with map
  // 3. Like/dislike listings
  // 4. Switch tabs and return
  // 5. Verify map state is preserved appropriately
})
```

## Final Validation Checklist

Before considering the project complete, verify that:

1. ✅ Liking/disliking a listing NEVER causes the map to flash or reset
2. ✅ Map position and zoom remain stable during all interactions
3. ✅ Trip state remains the single source of truth
4. ✅ Map holds a local, eventually-consistent copy of relevant state
5. ✅ Performance metrics show improvement (reduced render counts, time)
6. ✅ Mobile experience is smooth and stable
7. ✅ All tests pass consistently
8. ✅ No regressions in functionality from the migration
9. ✅ Code is clean, well-documented, and maintainable

## Expected End State

- Liking a listing never causes the map to flash or reset
- Trip-wide state remains the single source of truth
- Map holds a local, eventually-consistent copy of state
- Future features can reuse the snapshot + actions pattern
- User experience is smooth and responsive, especially on mobile
- Performance metrics show significant improvement
- Architecture is more maintainable and scalable

# Optimizing MapView Renders in React

`SearchMap` re-creates its markers only when React re-renders its parent (`MapView`). Liking a listing mutates `TripContext` → `state.lookup`, causing every consumer of the context to re-render, including `MapView`, even though the longitude/latitude data `SearchMap` needs remains unchanged. The solution is to decouple the expensive map from frequent "like" state updates.

## 1. Subscribe to Just the Data the Map Needs

Instead of reading the entire context, select only the relevant slices using `use-context-selector` (or React 18’s `useContext` overload when available).

```tsx
/* MapView.tsx */
import { useContextSelector } from 'use-context-selector';

const listings = useContextSelector(TripContext, s => s.state.showListings);
const tripCenter = useContextSelector(TripContext, s => [s.state.trip.longitude, s.state.trip.latitude] as [number, number]);
```

Since `optimisticLike` only mutates `lookup`, the selector maintains the same reference, preventing `MapView` (and the map) from re-rendering.

## 2. Memoize the Heavy Child (`SearchMap`)

Short-circuit re-renders with a memoized component and a custom equality function that ignores props unaffected by marker geometry.

```tsx
/* search-map.tsx */
export default React.memo(SearchMap, (prev, next) => {
  // Centre, zoom, or fullscreen toggle changed? → Must re-render
  if (prev.isFullscreen !== next.isFullscreen) return false;
  if (prev.zoom !== next.zoom) return false;
  if (prev.center?.[0] !== next.center?.[0] || prev.center?.[1] !== next.center?.[1]) return false;

  // Do the coordinates of the markers change?
  if (prev.markers.length !== next.markers.length) return false;
  for (let i = 0; i < prev.markers.length; i++) {
    if (prev.markers[i].lat !== next.markers[i].lat || prev.markers[i].lng !== next.markers[i].lng) return false;
  }
  // Ignore colour/like status → No expensive redraw
  return true;
});
```

## 3. Build the Markers Array with `useMemo`

Use `useMemo` to compute the markers array, depending only on `listings` and avoiding `lookup`.

```tsx
/* MapView.tsx */
const markers = useMemo(
  () => listings.map(l => ({
    lat: l.latitude,
    lng: l.longitude,
    listing: l
  })), // No colour here
  [listings] // ← NOT lookup
);
```

## 4. Recolour Pins Without Re-rendering (Optional)

To update pin colours when a user likes a listing, recolour existing pins in-place (cheap) instead of re-rendering the map (expensive).

```tsx
/* search-map.tsx */
const favIds = useTripContext(s => s.state.lookup.favIds); // Selector again

useEffect(() => {
  favIds.forEach(id => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.getElement()
        .querySelectorAll('path')
        .forEach(p => p.setAttribute('fill', '#00C853')); // Green
    }
  });
}, [favIds]);
```

## Result

- Liking a property updates only the `lookup` slice, leaving `MapView` and `SearchMap` untouched.
- Pin colours update in-place, avoiding recreation of the MapLibre instance and preventing flicker.
- Choose the subset of techniques (`use-context-selector`, `React.memo`, `useMemo`, pin-only updates) that aligns with your performance goals and code style.


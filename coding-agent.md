# Plan: Decouple Search-Map Components From `TripContext`

## Objective
Prevent TripContext state updates (e.g., liking a listing) from forcing re-renders of the heavy map components, while still allowing those components to **dispatch** updates back to TripContext and to receive a **fresh snapshot** on their next mount.

## Core Idea
1. **Split Context** into **State** and **Actions** so components can subscribe to only what they need.
2. Provide a hook that yields a **one-time snapshot** of desired Trip data (no subscriptions).
3. Map components keep their own **local copy** of listings/filters; they update it optimistically on likes while also calling Trip actions.

---

## Detailed Steps

### 1. Introduce Two Separate Contexts
| Context | Contains | Purpose |
|---------|----------|---------|
| `TripStateContext` | Immutable state object (`trip`, `searchResults`, etc.) | Subscribed to only by components that **must** re-render on every Trip change. |
| `TripActionsContext` | Methods (`likeListing`, `unlikeListing`, setters…) | Stable refs via `useCallback` so consumers never re-render when methods array identity changes. |

`TripContextProvider` will render two nested `<Context.Provider>` elements:
```tsx
<TripActionsContext.Provider value={actions}>
  <TripStateContext.Provider value={state}>
    {children}
  </TripStateContext.Provider>
</TripActionsContext.Provider>
```
Using nested order keeps `actions` free of `state` dependency chains.

### 2. Create Helper Hooks
```tsx
// One-time snapshot (no subscriptions)
export function useTripSnapshot<T>(selector: (s: TripState) => T): T {
  const state = useContext(TripStateContext);
  // selector runs once; eslint-ignore exhaustive-deps intentional
  return useMemo(() => selector(state), []);
}

// Stable actions
export function useTripActions() {
  return useContext(TripActionsContext);
}
```

### 2.1 Evaluate Zustand for `TripActionsContext`

Zustand can replace the dedicated **actions** context by exposing a tiny global store that only holds **bound action creators**.

**Pros**

- **Zero component re-renders**: Components obtain functions via `const like = useTripActions((s) => s.likeListing);` — because they never subscribe to state, they never re-render.
- **Stable function identity** without extra `useCallback`.
- Very **small bundle (~1 kB)**, supports devtools/middleware out of the box.

**Cons / Considerations**

- Introduces an external dependency (albeit light).
- Actions now live outside React’s tree; mocking/testing requires the Zustand API rather than React context wrappers.
- If we later move *state* to Zustand as well, we must manage SSR hydration separately.

**Implementation sketch**

```ts
// trip-actions-store.ts
import { create } from 'zustand';

type TripActions = {
  likeListing: (id: string) => void;
  // additional actions...
};

export const useTripActions = create<TripActions>(() => ({
  likeListing: (id) => {
    /* previous likeListing logic here */
  },
}));
```

Usage in map components remains unchanged except for the import:

```tsx
const likeListing = useTripActions((a) => a.likeListing);
likeListing(listingId);
```

This swaps out the second context with a Zustand store while preserving the overall data-flow strategy.

### 3. Refactor Map Components

1. Replace direct `useTripContext()` calls with:
   ```tsx
   const initialListings = useTripSnapshot(s => s.searchResults);
   const { likeListing } = useTripActions();
   const [listings, setListings] = useState(initialListings);
   ```
2. On **like**:
   ```tsx
   const handleLike = (listingId: string) => {
     setListings(prev => toggleLikeLocally(prev, listingId)); // optimistic UI
     likeListing(listingId); // mutate global state – but map stays untouched
   };
   ```
3. Any subsequent Trip updates won’t trigger re-renders because the component no longer subscribes to `TripStateContext`.
4. When route/tab is changed (unmount → mount), the component receives a new snapshot, reflecting the latest Trip data.

### 4. Optional Enhancements
* Use [`use-context-selector`](https://github.com/dai-shi/use-context-selector) instead of the custom snapshot hook for finer-grained subscriptions.
* Supply a `key={trip.id}` on the tab wrapper to force a remount when the active trip changes.
* Memoise heavy map sub-trees (`React.memo`, `useMemo`) to further curb render costs.

### 5. Migration Strategy
1. Introduce new contexts & hooks **without** removing the legacy TripContext to avoid a big-bang change.
2. Incrementally refactor map-related files:
   * `search-map-tab.tsx`
   * `search-map.tsx`
   * `search-map-mobile.tsx`
3. After verifying map stability, migrate other components where warranted.
4. Delete legacy combined context once no consumers remain.

### 6. Edge-Cases & Testing
* Ensure optimistic UI stays in sync if the like API call fails; revert local state on error.
* Confirm that unmount/remount cycle (e.g., tab switch) reflects new Trip data.
* Regression test: liked listing should remain on the map with updated icon/colour.

---

## Expected End State
* Liking a listing **never** causes the map to flash or reset.
* Trip-wide state remains the single source of truth; map holds a local, eventually-consistent copy.
* Future features (e.g., bulk edits) can reuse the snapshot + actions pattern.

# Renter Dashboard Data Fetching Architecture

## Overview

The renter dashboard (`/rent/dashboard`) displays multiple sections showing different aspects of a user's rental journey. Each section has its own specific data requirements and fetching logic.

## Data Fetching Strategy

All data is fetched **in parallel** using `Promise.all()` to optimize performance and avoid sequential waterfall requests. Each section's data is queried independently with explicit comments explaining the purpose and scope.

## Sections

### 1. Recent Searches
**Query:** Top 10 most recent trips  
**Data Needed:** Basic trip information only  
**Rationale:** Shows recent search activity without loading related data

```typescript
prisma.trip.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 10,  // Limited to 10 for UI display
  select: { /* basic fields only */ }
})
```

### 2. Bookings
**Query:** All user bookings via `getUserBookings()`  
**Data Needed:** Booking details with listing and trip info  
**Rationale:** Shows all active and past bookings

### 3. Matches
**Query:** All matches across all trips  
**Data Needed:** Match data with full listing information  
**Rationale:** Displays all properties where the user matched with a landlord  
**Note:** Fetched directly from `match` table, not limited by trip recency

```typescript
prisma.match.findMany({
  where: { trip: { userId } },
  include: { listing: { /* full data */ } }
})
```

### 4. Applications
**Query:** All pending housing requests via `getUserHousingRequests()`  
**Data Needed:** Application details with listing and trip info  
**Rationale:** Shows pending applications awaiting landlord response

### 5. Favorites
**Query:** ALL favorites across ALL trips  
**Data Needed:** Favorite with listing data and application status  
**Rationale:** Shows every listing the user has favorited, regardless of trip age  
**Important:** This query is **NOT** limited to recent trips  
**Filtering:** Excludes favorites that have been upgraded to matches (no duplicates between sections)

```typescript
// Fetch ALL favorites (not limited by trip recency)
prisma.favorite.findMany({
  where: {
    trip: { userId },
    listingId: { not: null }
  }
})

// Filter out favorites that have become matches
const matchedListingIds = new Set(matchesRaw.map((match) => match.listingId));
const activeFavorites = favoritesRaw.filter(
  (fav) => fav.listingId !== null && !matchedListingIds.has(fav.listingId)
);

// Then check which favorites have applications
const allHousingRequests = await prisma.housingRequest.findMany({
  where: {
    trip: { userId },
    listingId: { in: favoriteListingIds }
  }
})
```

## Why This Architecture?

### Previous Issues
The original implementation had two problems:

1. **Limited Trip Scope**: Fetched only the 10 most recent trips and derived favorites from those trips
   - Users with many trips only saw favorites from recent trips
   - Older favorites were hidden even though they're still relevant
   - User had 75 favorites but only 2 showed (from the 2 most recent trips with favorites)

2. **No Duplicate Prevention**: Favorites that became matches showed in both sections
   - Confusing user experience seeing the same listing twice
   - Doesn't reflect the progression from favorite → match → booking

### Current Solution
Each section queries its data independently with proper filtering:
- **Recent Searches** is limited to 10 trips (UI constraint)
- **Favorites** queries ALL favorites across ALL trips, excluding those upgraded to matches
- **Matches** queries ALL matches (not derived from trips)
- All queries run in parallel for optimal performance
- Pipeline progression: Favorites → Matches → Bookings (no duplicates)

## Performance Considerations

1. **Parallel Execution**: All queries run simultaneously via `Promise.all()`
2. **Selective Includes**: Each query only includes the data it needs
3. **Efficient Listing Fetch**: Favorites fetch listings in a single batch query
4. **Application Status**: Check which favorites have applications in one query

## Data Flow

```
getRenterDashboardData()
├── Promise.all([
│   ├── currentUser()           → user profile
│   ├── trip.findMany()         → recent searches (top 10)
│   ├── getUserBookings()       → all bookings
│   ├── match.findMany()        → all matches
│   ├── getUserHousingRequests() → all applications
│   └── favorite.findMany()     → ALL favorites
│   ])
├── Fetch listing data for favorites
├── Check application status for favorites
└── Transform and return data
```

## Future Improvements

- Consider pagination for favorites if users have 100+ favorites
- Cache frequently accessed listing data
- Add date-based filtering options for users to view favorites by time period

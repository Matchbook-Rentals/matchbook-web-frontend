# Roll Search Dates & Expire Outdated Items

**Endpoint:** `/api/cron/roll-search-dates`
**Schedule:** Daily (recommended early morning)
**Purpose:** Expires outdated searches/applications/matches and updates Trip search dates to keep active searches current

## Description

This job performs two critical functions:

1. **Expiration Management**: Identifies and expires trips, housing requests (applications), and matches with past end dates, sending notifications to affected users
2. **Date Rolling**: Maintains the relevance of active searches by rolling forward outdated dates while preserving the user's intended search duration

## Business Logic

### Part 1: Expiration Logic

#### 1. Expire Trips
- Marks trips with `endDate < today` as 'expired'
- Updates `tripStatus` to 'expired'

#### 2. Expire Housing Requests
- Marks housing requests (applications) with `endDate < today` as 'expired'
- Creates in-app notification for the renter
- Sends email notification: "Your application for [listing] has expired because the dates have passed"
- Directs users back to `/app/rent/searches` to create new searches

#### 3. Expire Matches
- Marks matches as 'expired' when associated trip `endDate < today`
- Creates in-app notification for the renter
- Sends email notification: "Your match for [listing] has expired because the dates have passed"
- Directs users to browse listings again

### Part 2: Date Rolling Logic (for non-expired trips)

1. **Find Outdated Searches**: Identifies trips where `startDate <= today` (includes past dates AND today)
2. **Roll Start Date**: Updates `startDate` to tomorrow for better search results
3. **Preserve Duration**: Maintains the original duration between start and end dates
4. **Enforce Minimum Duration**: Ensures searches meet the 1 calendar month minimum requirement
5. **Adjust End Date**: If rolling causes duration to shrink (especially across month boundaries), end date is extended to maintain at least the original duration

## Example Scenarios

### Date Rolling
- **Search**: Jan 14 → Feb 14 (31 days), Start date is today (Jan 14)
  - **Result**: Jan 15 → Feb 15 (maintains 31+ days)

- **Search**: Jan 10 → Jan 20 (10 days), Start date is past (Jan 10)
  - **Result**: Tomorrow → Tomorrow + 10 days (preserves 10-day duration)

- **Search**: Dec 31 → Jan 31 (31 days), Start date is today (Dec 31)
  - **Result**: Jan 1 → Feb 1+ (ensures minimum 31-day duration across month boundary)

### Expiration
- **Search**: Jan 1 → Jan 31, Today is Feb 1
  - **Result**: Trip status → 'expired', housing requests → 'expired', matches → 'expired'
  - **Notifications**: Users receive in-app and email notifications about expired applications/matches

## Why This Matters

### Active Search Maintenance
- Keeps user searches active and relevant
- Prevents searches from becoming stale due to past dates
- Maintains user intent regarding search duration
- Enforces minimum 1 calendar month duration requirement
- Improves platform engagement by showing current results
- Users don't need to manually update their search dates

### Data Accuracy & User Communication
- **Cleans up expired data** to maintain accurate search/application states
- **Notifies users** when their applications or matches expire, prompting them to create new searches
- Prevents confusion about old applications/matches
- Encourages users to re-engage with the platform

## Processing Details

- Expiration runs first, then date rolling for active searches
- Updates are processed in batches of 10 trips to avoid timeouts
- Each batch uses database transactions for consistency
- Notifications are created for each expired housing request and match
- Email notifications respect user preferences
- Comprehensive logging includes:
  - Number of expired trips
  - Number of expired housing requests
  - Number of expired matches
  - Number of notifications sent
  - Number of trips with rolled dates
- Returns comprehensive status including all counts

## Notifications

### Housing Request Expired
- **Subject**: "Your Application Has Expired"
- **Content**: "Your application for [listing] has expired because the dates have passed. Browse available listings to find your next match"
- **Action**: Browse Listings button → `/app/rent/searches`

### Match Expired
- **Subject**: "Your Match Has Expired"
- **Content**: "Your match for [listing] has expired because the dates have passed. Browse available listings to find your next match"
- **Action**: Browse Listings button → `/app/rent/searches`

## Implementation Details

**File:** `src/app/api/cron/roll-search-dates/route.ts`

### Key Functions
- `expireOutdatedItems()`: Handles all expiration logic and notifications
- `findOutdatedTrips()`: Queries for active trips needing date updates
- `processTripsForDateRolling()`: Calculates new dates for each trip
- `executeTripsUpdate()`: Batch updates trips in database
- `addOneCalendarMonth()`: Ensures proper month boundary handling

### Database Schema Changes
- `TripStatus` enum: Added 'expired' status
- `Match` model: Added `status` field (default: "active")
- `HousingRequest` model: Uses existing `status` field

## Testing

### Test Files
- Comprehensive test cases: `test-calendar-month-logic.js`
- Tests cover date boundary scenarios (month-end, leap years, etc.)

### Manual Testing
1. Create test trips with various date configurations
2. Set end dates in the past for expiration testing
3. Navigate to `/app/admin/cron-jobs`
4. Find "Roll Search Dates"
5. Click "Trigger Now"
6. Verify:
   - Trips/housing requests/matches are expired
   - Notifications are created
   - Active trip dates are rolled forward correctly

## Manual Trigger

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.com/api/cron/roll-search-dates
```

## Monitoring

Monitor through:
- Application logs (expiration counts, date rolling counts)
- Admin cron jobs interface (execution status and counts)
- User notification system (verify notifications are sent)
- Database queries (check for expired status changes)

## Response Format

```json
{
  "success": true,
  "processedTrips": 15,
  "updatedTrips": 15,
  "expiredTrips": 5,
  "expiredHousingRequests": 8,
  "expiredMatches": 3,
  "notificationsSent": 11,
  "message": "Updated 15 trip search dates, expired 5 trips, 8 housing requests, 3 matches"
}
```

## Edge Cases Handled

### Month Boundary Handling
- Jan 31 + 1 month → Feb 28/29 (not Mar 2/3)
- Properly handles leap years
- Maintains minimum duration across boundaries

### Time Zone Handling
- All dates use UTC for consistency
- Date comparisons use calendar dates (not timestamps)
- Prevents time zone-related double processing

### Concurrent Updates
- Batch processing prevents timeout issues
- Transactions ensure data consistency
- Idempotent operations allow safe retries

## Configuration

### Scheduling Recommendation
Run daily in early morning (e.g., 2:00 AM UTC) to:
- Process expirations before users start their day
- Roll dates before users begin searching
- Complete before peak usage hours

### Performance Tuning
- `BATCH_SIZE`: 10 trips per batch (configurable)
- Transaction timeout: 30 seconds
- Max wait time: 10 seconds

## Related Documentation

- [Trip/Search Data Model](/docs/data-models.md)
- [Notification System](/ docs/notifications.md)
- [Housing Requests (Applications)](/docs/applications.md)
- [Match System](/docs/matching.md)

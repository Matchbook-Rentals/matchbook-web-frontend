# pullListingsFromDb Filter Requirements

Filter execution order and purpose for the `pullListingsFromDb` function in `src/app/actions/listings.ts`.

## Filter Execution Order

### 1. Authentication Check
- **What**: Verifies user is authenticated via Clerk
- **Purpose**: Security - only authenticated users can search listings

### 2. Input Validation
- **What**: Validates lat/lng bounds, positive radius, valid dates, non-empty state
- **Purpose**: Prevent invalid queries and potential errors

### 3. State Expansion
- **What**: Looks up neighboring states using `statesInRadiusData`
- **Purpose**: Include cross-border results for better search coverage

### 4. Raw SQL Query - Geographic, Approval & Active Status Filtering
- **What**: Filters by states first, then `approvalStatus = 'approved'`, then `markedActiveByUser = true`, then distance using Haversine formula
- **Purpose**: State filtering uses indexed column to drastically reduce lat/lng calculations. Early approval and active status filtering further reduces dataset before expensive distance calculations.

### 5. Prisma Query - Detailed Filtering
Applied to the reduced set of listing IDs from step 4:

#### a. Unavailability Filter
- **What**: Excludes listings with overlapping unavailable periods
- **Purpose**: Ensure listings are actually available for requested dates

#### b. Monthly Pricing Filter  
- **What**: Only includes listings with pricing for the trip duration (calculated as months)
- **Purpose**: Ensure listings can accommodate the requested stay length

### 6. Data Combination & Sorting
- **What**: Combines distance data with full listing details, sorts by distance
- **Purpose**: Return complete listing information ordered by proximity

## Performance Strategy

**Two-stage approach**: First stage uses raw SQL with indexed state column to drastically reduce the dataset before expensive distance calculations. Second stage applies complex filters to the smaller result set.
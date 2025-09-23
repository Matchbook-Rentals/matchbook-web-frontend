# Listing Deletion Constraints

## Overview
This document outlines the constraints and rules for deleting listings in the Matchbook platform to prevent data loss and maintain business integrity.

## Deletion Rules

### Authentication & Authorization
- User must be authenticated (`checkAuth()`)
- Only the listing owner can delete their own listings
- Admins cannot delete user listings through this action

### Blocking Constraints
The following conditions will **prevent** listing deletion:

#### Active Bookings
- Any booking with status other than `completed` or `cancelled`
- Bookings with future start dates
- Active stays (current date between startDate and endDate)

#### Open Matches
- Matches without both landlord and tenant signatures
- Recent match activity (payment authorized but not captured)
- Matches with pending payment intents

#### Pending Housing Requests
- Housing requests with status `pending`
- Recent housing requests awaiting approval

### Safe Cascade Deletion
The following entities are **safely deleted** when a listing is removed:

#### Listing Metadata
- `ListingImages` - Property photos
- `Bedrooms` - Room configurations
- `ListingMonthlyPricing` - Pricing tiers
- `ListingUnavailability` - Blocked dates

#### User Interactions
- `Dislikes` - User dislikes of this listing
- `Maybes` - User maybes for this listing
- `Favorites` - User favorites of this listing
- `ListingLocationChanges` - Location change history
- `PdfTemplates` - Listing-specific document templates

#### Conversations (Optional)
- Listing-related conversations may be preserved for history

#### Reviews (Preserve)
- Reviews are typically preserved for historical data and host reputation

## Implementation

### Server Action Location
`/src/app/actions/listings.ts` - `deleteListing()` function

### Error Messages
- "Cannot delete listing with active bookings"
- "Cannot delete listing with pending matches"
- "Cannot delete listing with pending housing requests"
- "Listing not found"
- "Unauthorized to delete this listing"

### Transaction Handling
All deletions are wrapped in a Prisma transaction to ensure atomicity.

## Database Schema Notes

### Removed Cascades
- `Booking` -> `Listing` relation: **NO CASCADE** (prevents accidental booking deletion)

### Preserved Cascades
- `ListingImage` -> `Listing`: `onDelete: Cascade`
- `Bedroom` -> `Listing`: `onDelete: Cascade`
- `ListingMonthlyPricing` -> `Listing`: `onDelete: Cascade`
- Other safe entities maintain cascade relationships

## Security Considerations
- Prevent deletion of listings with financial obligations
- Maintain rental history for legal/tax purposes
- Preserve user communication threads
- Audit trail for listing deletions
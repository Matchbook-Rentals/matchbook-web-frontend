# Design Document: Unauthenticated User Experience

## Executive Summary

This document outlines the implementation strategy for allowing unauthenticated users to explore the Matchbook platform, create searches, and interact with listings before being prompted to sign in at strategic high-intent moments.

## Current State Analysis

### Middleware Protection
- `/app/*` routes are protected by Clerk middleware (requires authentication)
- `/guest/*` routes exist but are incomplete/outdated
- Public routes include home page and marketing pages

### Existing Guest Infrastructure
- `/guest/trips/` - Basic structure exists
- `/guest/listing/[listingId]` - Public listing view exists
- `/guest/trips/[tripId]` - Partial implementation

### Identified Issues
1. **No Pre-emptive Auth Check for Trip Creation**
   - SearchDialog allows full form completion before checking auth
   - Auth check only happens server-side when calling `createTrip`
   - Creates poor UX - users complete the entire flow before being blocked

2. **BrandModal Not Used for Auth Prompts**
   - BrandModal.tsx is a generic modal wrapper component
   - Not specifically designed for sign-in prompts
   - No auth-specific prompting logic found for trip creation

3. **Like Button Auth Missing**
   - The like functionality assumes an authenticated user
   - No sign-in prompt when unauthed users click like on listings
   - Context requires a trip to exist, which requires auth

## Proposed Architecture

### 1. Guest Search Flow (`/guest/rent/searches`)

#### Route Structure
```
/guest/rent/searches              # Guest search interface (simulates authenticated experience)
/guest/rent/searches/preview      # Shows sample listings without real search
/guest/rent/searches/[sessionId]  # Temporary session-based search results
```

#### Key Components
- **Guest Trip Context** - Lightweight version storing data in localStorage/sessionStorage
- **Session Management** - Generate temporary session IDs for guest searches
- **Data Persistence** - Store search parameters to resume after sign-in

### 2. Server Actions

#### New Guest Trip Creation Action
We need a separate server action specifically for guest trip creation that:
- Does NOT require authentication
- Creates a temporary session instead of a database trip
- Stores search parameters in localStorage/sessionStorage
- Returns a session ID for tracking

```typescript
// src/app/actions/guest-trips.ts
export async function createGuestTrip(tripData: {
  locationString: string;
  latitude: number;
  longitude: number;
  startDate?: Date | null;
  endDate?: Date | null;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}): Promise<GuestTripResponse> {
  // No auth check required
  // Generate session ID
  // Store in session storage
  // Return guest trip data with session ID
}
```

### 3. Authentication Intercepts

#### Trigger Points

1. **Search Submission** (SearchDialog.tsx)
   - Allow full form completion
   - Check auth status before submission
   - If authenticated → use existing `createTrip` action
   - If unauthenticated → use new `createGuestTrip` action
   - After guest trip creation → redirect to `/guest/rent/searches/[sessionId]`

2. **Like/Favorite Action** (listing interactions)
   - Click like → Check auth status
   - If unauthenticated → BrandModal sign-in prompt
   - Message: "Sign in to save your favorites"
   - Store action intent for post-auth execution

3. **Apply to Property**
   - Click apply → BrandModal sign-in prompt
   - Message: "Create an account to apply"

### 4. Sign-In Modal Enhancement

#### BrandModal Implementation
```tsx
// New component: src/components/auth-prompt-modal.tsx
<BrandModal
  isOpen={showAuthPrompt}
  onOpenChange={setShowAuthPrompt}
>
  <AuthPromptContent
    title="Sign in to continue"
    message={contextualMessage}
    redirectUrl={postAuthRedirect}
    pendingAction={pendingAction}
  />
</BrandModal>
```

#### Contextual Messages
- Search continuation: "Sign in to save your search and see personalized results"
- Like: "Sign in to save your favorite listings"
- Apply: "Create an account to apply for this property"
- Contact host: "Sign in to message the host"

### 5. Post-Authentication Flow

#### Data Recovery Process
1. Check localStorage for pending guest session
2. Retrieve stored search parameters
3. Create real trip in database using stored parameters
4. Execute any pending likes/applications
5. Redirect to appropriate authenticated route
6. Clear guest session data

#### Route Mapping
```
/guest/rent/searches/[sessionId] → /app/rent/searches/[newTripId]
/guest/listing/[id] → /app/rent/searches/[tripId]/listing/[id]
```

### 6. Guest Experience Features

#### Allowed Actions (No Auth Required)
- Browse sample/cached listings
- Use search filters (visual only, no database queries)
- View listing details
- See neighborhood information
- Calculate commute times
- View photos and amenities

#### Restricted Actions (Show Auth Prompt)
- Save searches permanently
- Like/favorite listings
- Contact hosts
- Apply to properties
- View host contact information
- Access messaging features

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `createGuestTrip` server action
2. Implement `GuestSessionService` for session management
3. Create `/guest/rent/searches` route structure
4. Implement guest-specific search components

### Phase 2: Auth Intercepts
1. Create `AuthPromptModal` component using BrandModal
2. Modify SearchDialog to check auth and route accordingly
3. Implement like button auth guards
4. Add auth checks to application buttons

### Phase 3: Data Persistence & Recovery
1. Implement localStorage schema for guest sessions
2. Create post-auth data recovery flow
3. Add session-to-trip conversion logic
4. Implement pending action execution

### Phase 4: Polish & Testing
1. Add loading states during auth transitions
2. Implement analytics tracking for conversion funnel
3. Add error handling and edge cases

## Technical Specifications

### Session Storage Schema
```typescript
interface GuestSession {
  id: string;
  searchParams: {
    location: string;
    lat: number;
    lng: number;
    startDate?: Date;
    endDate?: Date;
    guests: {
      adults: number;
      children: number;
      pets: number;
    };
  };
  pendingActions: {
    type: 'like' | 'apply' | 'contact';
    listingId: string;
    timestamp: number;
  }[];
  createdAt: number;
  expiresAt: number; // Session expires after 24 hours
}
```

### Guest Trip Response
```typescript
interface GuestTripResponse {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  error?: string;
}
```

## Security Considerations

1. **Data Protection**
   - No sensitive data stored in localStorage
   - Session IDs are UUIDs, non-guessable
   - Guest searches don't hit database until authenticated
   - Session data expires after 24 hours

2. **Rate Limiting**
   - Implement rate limiting on guest search creation
   - Maximum 10 guest searches per IP per hour
   - Prevent abuse of preview functionality

3. **Content Security**
   - Sample listings should be curated and non-sensitive
   - No real host contact information shown to guests
   - Watermark or badge guest view listings


## Success Metrics

### Primary KPIs
- **Conversion Rate**: Guest → Signed-in user (Target: 25%)
- **Search Completion Rate**: Searches started vs completed (Target: 60%)
- **Time to Sign-up**: From first interaction (Target: < 5 minutes)
- **Abandoned Search Recovery**: Searches resumed post-auth (Target: 40%)

### Secondary Metrics
- Average number of listings viewed before sign-up
- Most common auth trigger point
- Guest session duration
- Bounce rate on auth prompt

## Analytics Implementation

Track the following events:
1. `guest_search_initiated`
2. `guest_search_completed`
3. `auth_prompt_shown` (with context)
4. `auth_prompt_dismissed`
5. `auth_prompt_accepted`
6. `guest_session_recovered`
7. `guest_like_attempted`
8. `guest_apply_attempted`


## Conclusion

This implementation strategy balances user exploration freedom with strategic authentication prompts, maximizing conversion while maintaining excellent user experience. The phased approach allows for iterative improvements based on real user data and feedback.

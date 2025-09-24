// DEPRECATED: This file is no longer used. Session tracking has been moved to Server Actions.
// See /src/app/actions/session-tracking.ts for the new implementation.
//
// The previous implementation caused errors because:
// 1. cookies() cannot be used in middleware - only in Server Actions or Route Handlers
// 2. Clerk auth functions needed proper async handling
//
// The new implementation uses Server Actions that run on the client side
// when authenticated users visit pages, avoiding middleware limitations.
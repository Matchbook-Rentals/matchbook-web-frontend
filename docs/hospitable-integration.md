# Hospitable Integration Documentation

## Overview
This document outlines the current state of the Hospitable API integration, implemented to sync Matchbook listings with the Hospitable property management platform.

## Current Implementation Status: ⚠️ BLOCKED - INSUFFICIENT SCOPES

### What's Implemented ✅

#### 1. OAuth Authentication Flow
- **Connect Endpoint**: `/api/hospitable/connect` - Initiates OAuth flow
- **Callback Endpoint**: `/api/hospitable/callback` - Handles OAuth callback and token storage  
- **Disconnect Endpoint**: `/api/hospitable/disconnect` - Clears stored tokens
- **Scope Check Endpoint**: `/api/hospitable/check-scopes` - Debugs current token permissions

#### 2. Database Schema
- Added Hospitable integration fields to User model:
  ```prisma
  hospitableAccessToken   String?   @db.VarChar(1500)
  hospitableRefreshToken  String?   @db.VarChar(1500)
  hospitableAccountId     String?   @unique
  ```
- Added `hospitablePropertyId` to Listing model for property sync tracking

#### 3. UI Components
- **Settings Integration**: `/host/dashboard/settings` - Connect/disconnect interface
- **Listing Connect Button**: Individual listing sync button in listing details
- **Success Page Button**: Connect button on listing creation success page

#### 4. API Endpoints
- **Sync Listing**: `/api/hospitable/sync-listing` - Syncs individual listings to Hospitable
- **Token Refresh**: Automatic token refresh when expired
- **Comprehensive Logging**: All endpoints include detailed debugging logs

### Current Blocker: OAuth Scope Limitations 🚫

#### Problem
Our OAuth token only has limited scopes: `["calendar:read", "calendar:write"]`

#### Required Scopes (Based on API Testing)
The following scopes are needed but not currently granted:
- `property:read` - For accessing properties endpoint (returns 403)
- `property:write` - For creating/updating properties  
- `listing:read` - For accessing listings data
- `listing:write` - For creating/updating listings
- `reservation:read` - For accessing booking data
- `reservation:write` - For managing reservations

#### Current OAuth Request
```javascript
const scopes = "property:read property:write listing:read listing:write reservation:read reservation:write calendar:read calendar:write";
```

#### API Endpoint Test Results
- ✅ `/v2/user` - 200 (accessible with current token)
- ❌ `/v2/properties` - 403 "Invalid scope(s) provided"
- ❌ `/v2/reservations` - 403 "Invalid scope(s) provided"  
- ❌ `/v2/listings` - 404 "Not found"
- ❌ `/v2/calendars` - 404 "Not found"

### Root Cause Analysis

The scope limitation is likely due to:

1. **Hospitable App Configuration**: The app may need additional permissions enabled in the Hospitable developer console
2. **Account Setup**: The Hospitable account may need to have actual properties/listings before property scopes are granted
3. **Scope Names**: The exact scope naming convention may differ from what we're requesting

### Next Steps to Resolve 🔧

#### Immediate Actions Needed:
1. **Check Hospitable Developer Console**:
   - Verify app has property management permissions enabled
   - Ensure all requested scopes are approved for the app

2. **Account Setup**:
   - Add actual properties/listings to the Hospitable account
   - Complete any required account verification steps

3. **Scope Research**:
   - Contact Hospitable support for exact scope names
   - Review their latest API documentation for scope requirements

#### Alternative Approaches:
1. **Manual Property Creation**: Create properties in Hospitable manually, then sync data
2. **Limited Integration**: Start with read-only calendar sync, expand later
3. **Support Request**: Contact Hospitable technical support for scope assistance

### Technical Architecture

#### File Structure
```
src/app/api/hospitable/
├── connect/route.ts          # OAuth initiation
├── callback/route.ts         # OAuth callback handler
├── disconnect/route.ts       # Token cleanup
├── sync-listing/route.ts     # Property sync (blocked)
└── check-scopes/route.ts     # Debug token permissions

src/app/app/host/
├── dashboard/settings/hospitable-connect.tsx    # Settings UI
└── [listingId]/(components)/
    └── hospitable-connect-button.tsx            # Listing sync UI
```

#### Data Transformation (Ready)
The sync endpoint includes comprehensive data transformation from Matchbook to Hospitable format:
- Property details mapping
- Amenities conversion  
- Pricing structure
- Address normalization
- Image URL handling

### Environment Variables Required

```bash
HOSPITABLE_CLIENT_ID=your_client_id
HOSPITABLE_CLIENT_SECRET=your_client_secret  
NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI=http://localhost:3000/api/hospitable/callback
```

### Debugging Tools

#### Check Current Scopes
Visit: `http://localhost:3000/api/hospitable/check-scopes`

#### Console Logs
All Hospitable-related logs are prefixed with `HOSPITABLE CHECK:` for easy filtering.

### Integration Testing Checklist

Once scopes are resolved:
- [ ] Test OAuth flow with new scopes
- [ ] Verify property creation via API
- [ ] Test listing sync end-to-end
- [ ] Validate data transformation accuracy
- [ ] Test token refresh mechanism
- [ ] Verify disconnect functionality

### Related Documentation
- [Hospitable API Docs](https://developer.hospitable.com/)
- [OAuth 2.0 Implementation](https://auth.hospitable.com/oauth/)

---

**Last Updated**: Current session  
**Status**: Blocked pending scope resolution  
**Next Review**: After Hospitable account/app configuration
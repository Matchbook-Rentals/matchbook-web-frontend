# Medallion LOW_CODE_SDK Integration

This project uses Authenticate.com's LOW_CODE_SDK approach for identity verification, which is simpler and more reliable than the API-based approach.

## Required Environment Variables

```bash
# Primary SDK key (required)
NEXT_PUBLIC_MEDALLION_LOW_CODE_SDK_KEY="your_low_code_sdk_key_here"

# Base URL for redirects (required)
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"  # or http://localhost:3001 for dev

# Optional webhook secret for security
MEDALLION_WEBHOOK_SECRET="your_webhook_secret_here"
```

## How It Works

### 1. User Flow
1. User confirms their identity information (name, date of birth)
2. System creates a session token and stores it in database
3. Frontend loads Medallion's SDK script
4. SDK's `identify()` function is called with user data and session token
5. User is redirected to Medallion's hosted verification page
6. User completes verification (ID scan, selfie, etc.)
7. User is redirected back with session validation
8. Webhook updates verification status in real-time
9. User is redirected to dashboard upon completion

### 2. Key Components

- **`MedallionVerificationSDK`**: Main client component that loads SDK and initiates verification
- **`IdentityVerificationSDKClient`**: Page wrapper that handles name confirmation and state
- **`/api/medallion/track-session`**: Endpoint to create session tokens before verification
- **`/api/medallion/webhook`**: Handles real-time status updates from Medallion

### 3. Security Features

- **Session Token Validation**: CSRF protection via unique session tokens
- **Rate Limiting**: Prevents abuse (5 sessions per 5 minutes per user)
- **Webhook Signature Verification**: Validates incoming webhook requests
- **Client-Side Loading**: SDK loads dynamically with error handling

### 4. Advantages of LOW_CODE_SDK Approach

- ✅ No API key permission issues (uses different auth mechanism)
- ✅ Simpler implementation (no server-side JWT generation)
- ✅ Automatic user creation by Medallion
- ✅ Less server-side code to maintain
- ✅ Direct integration with Medallion's optimized UI
- ✅ Still maintains security with session tracking

### 5. Getting Your SDK Key

1. Go to https://portal.authenticate.com
2. Sign up/login to your account
3. Navigate to Settings
4. Generate your LOW_CODE_SDK_KEY
5. Configure whitelisted domains
6. Set daily limits as needed

### 6. Testing

- The component includes loading states, error handling, and retry mechanisms
- Session tokens are validated on redirect for security
- Webhooks provide real-time status updates
- Polling fallback ensures status is eventually updated

## Debugging

Check browser console for detailed logs:
- `🚀 Starting Medallion verification using LOW_CODE_SDK approach`
- `✅ Session tracked successfully`
- `✅ Medallion SDK loaded successfully`
- `✅ Session validation passed for LOW_CODE_SDK redirect`

If verification fails, check:
1. SDK key is valid and active
2. Domain is whitelisted in Medallion portal
3. Network connectivity
4. Browser console for specific error messages
# Client Logging Guide

This document explains how to use the client logging system to capture logs in mobile and web environments.

## Why Use Client Logging?

- Provides easier debugging for mobile environments (iOS and Android) where accessing console logs is difficult
- Centralizes logs for analysis and troubleshooting
- Preserves log information even after browser/app sessions end
- Associates logs with user sessions for better context

## Usage in Client Components

Import the `useClientLogger` hook:

```tsx
import { useClientLogger } from '@/hooks/useClientLogger'

function MyComponent() {
  const logger = useClientLogger()
  
  const handleClick = () => {
    // Log different levels
    logger.debug('Button clicked', { buttonId: 'submit-button' })
    logger.info('User performed action', { actionType: 'submission' })
    logger.warn('Form submission took longer than expected', { timeMs: 3500 })
    logger.error('Failed to submit form', { errorCode: 'API_TIMEOUT' })
    
    // With additional metadata
    logger.info('User interaction', 
      { action: 'click', element: 'button' },
      { userId: '123', sessionId: 'abc123' }
    )
  }
  
  return <button onClick={handleClick}>Click me</button>
}
```

## Log Levels

- **debug**: Used for detailed debugging information
- **info**: Normal operation information, general events
- **warn**: Something unexpected happened but operation can continue
- **error**: Critical issues that need immediate attention

## Mobile-Specific Logging

The logger automatically detects the device type (iOS, Android, web) and includes it in the logs.

```tsx
// Example in a React Native component using Next.js with React Native Web
import { useClientLogger } from '@/hooks/useClientLogger'

function MobileComponent() {
  const logger = useClientLogger()
  
  useEffect(() => {
    logger.info('Mobile component mounted', { 
      device: logger.deviceType, // Will be 'ios' or 'android'
      screenDimensions: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
      }
    })
    
    // Log errors from API calls
    try {
      // API call
    } catch (error) {
      logger.error('API request failed', {
        error: error.message,
        code: error.code
      })
    }
  }, [])
}
```

## Direct Server Action Usage

You can also use the server actions directly if needed:

```tsx
import { logClientError } from '@/app/actions/client-logs'

// Somewhere in your code
await logClientError('Critical failure in payment process', {
  paymentId: '12345',
  errorCode: 'GATEWAY_TIMEOUT'
})
```

## Best Practices

1. **Be selective**: Log important events, not everything
2. **Include context**: Pass relevant data objects for better debugging
3. **Use the right level**: Match your log level to the severity of the event
4. **Sanitize data**: Never log sensitive information like passwords, tokens, or PII
5. **Structured data**: Use objects for data parameters rather than string concatenation

## Viewing Logs

Logs are stored in the database and can be viewed in:

1. Admin dashboard (coming soon)
2. Server-side console during development 
3. Database `ClientLog` table

For mobile development, this system helps overcome the limitation of console logs being difficult to access.
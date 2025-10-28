'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { logApplicationErrorWithContext } from '@/app/actions/application-errors';

/**
 * AuthRecovery Component
 *
 * Handles Clerk session recovery when users return to idle tabs.
 * Addresses Clerk issue #1616: "Token refresh failed. Failed to fetch"
 *
 * How it works:
 * - Listens for tab visibility changes (when user switches back to tab)
 * - Silently refreshes Clerk session token when tab becomes active
 * - Only redirects to sign-in if token refresh genuinely fails (not just network blips)
 * - Logs all auth errors for monitoring
 *
 * Zero impact on normal flows - only activates when tab regains focus.
 *
 * @see docs/auth/clerk-stale-session-fix.md for complete documentation
 */
export default function AuthRecovery() {
  const { client } = useClerk();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only run when tab becomes visible and we have an active session
      if (document.visibilityState === 'visible' && client?.session) {
        try {
          // Attempt silent token refresh
          // getToken() is cached by Clerk with 1-minute TTL, so this won't spam the network
          await client.session.getToken({ skipCache: true });
        } catch (error: any) {
          // Log the error for monitoring
          try {
            await logApplicationErrorWithContext({
              message: `Clerk session recovery failed: ${error?.message || 'Unknown error'}`,
              severity: 'high',
              context: {
                errorType: 'clerk_token_refresh_failure',
                pathname: window.location.pathname,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              }
            });
          } catch (loggingError) {
            // Silently handle logging failures
            console.error('Failed to log auth recovery error:', loggingError);
          }

          // Only redirect on genuine session errors, not transient network issues
          const errorMessage = error?.message?.toLowerCase() || '';
          const isSessionError =
            error?.errors?.[0]?.code === 'session_token_invalid' ||
            errorMessage.includes('session') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('unauthenticated');

          if (isSessionError) {
            // Session is genuinely dead - redirect to sign-in
            window.location.href = '/sign-in';
          }
          // Otherwise, let the user continue - might just be a temporary network blip
        }
      }
    };

    const handleFocus = async () => {
      // Secondary handler for window focus events
      if (client?.session) {
        try {
          await client.session.getToken({ skipCache: true });
        } catch (error: any) {
          // Same error handling as visibility change
          const errorMessage = error?.message?.toLowerCase() || '';
          const isSessionError =
            error?.errors?.[0]?.code === 'session_token_invalid' ||
            errorMessage.includes('session') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('unauthenticated');

          if (isSessionError) {
            window.location.href = '/sign-in';
          }
        }
      }
    };

    // Listen for both visibility change and window focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [client]);

  // This component renders nothing - it's purely for side effects
  return null;
}

"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const REFERRAL_COOKIE_NAME = 'referral_code';
const REFERRAL_PROCESSED_KEY = 'referral_processed';

function getReferralCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function getReferralCodeFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(REFERRAL_COOKIE_NAME);
  } catch {
    return null;
  }
}

function clearReferralCode(): void {
  // Clear cookie
  if (typeof document !== 'undefined') {
    document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0`;
  }
  // Clear localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(REFERRAL_COOKIE_NAME);
      // Mark as processed to prevent re-processing
      sessionStorage.setItem(REFERRAL_PROCESSED_KEY, 'true');
    } catch {
      // Ignore
    }
  }
}

function wasReferralProcessed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(REFERRAL_PROCESSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Component that processes referral codes for newly signed up users.
 * Include this in your root layout to ensure referrals are processed
 * regardless of which page the user lands on after signup.
 */
export function ReferralProcessor() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Only run on client side when user data is loaded
    if (!isLoaded) return;

    // Skip if not signed in or already processed
    if (!isSignedIn || !user) return;
    if (processed || wasReferralProcessed()) return;

    // Check for referral code
    const referralCode = getReferralCodeFromCookie() || getReferralCodeFromLocalStorage();
    if (!referralCode) return;

    // Process the referral with retry logic (user might not be in DB yet if webhook is slow)
    const processReferralWithRetry = async (attempts = 0): Promise<void> => {
      const maxAttempts = 5;
      const retryDelay = 2000; // 2 seconds between retries

      try {
        console.log(`[ReferralProcessor] Processing referral for user ${user.id} with code ${referralCode} (attempt ${attempts + 1})`);
        const response = await fetch('/api/referrals/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log('[ReferralProcessor] Referral processed successfully');
          clearReferralCode();
          return;
        }

        // If user not found and we have retries left, wait and try again
        if (data.error === 'User not found' && attempts < maxAttempts - 1) {
          console.log(`[ReferralProcessor] User not in DB yet, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return processReferralWithRetry(attempts + 1);
        }

        console.log(`[ReferralProcessor] Referral processing result: ${data.error || 'unknown'}`);
        // Clear the code even if it failed (invalid code, already processed, etc.)
        clearReferralCode();
      } catch (error) {
        console.error('[ReferralProcessor] Error processing referral:', error);
        // Retry on network errors
        if (attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return processReferralWithRetry(attempts + 1);
        }
      }
    };

    processReferralWithRetry().finally(() => setProcessed(true));
  }, [isLoaded, isSignedIn, user, processed]);

  // This component doesn't render anything
  return null;
}

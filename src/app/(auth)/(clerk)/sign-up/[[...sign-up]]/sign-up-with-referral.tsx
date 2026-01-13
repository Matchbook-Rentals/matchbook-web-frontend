"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";

const REFERRAL_COOKIE_NAME = 'referral_code';

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
    } catch {
      // Ignore
    }
  }
}

export function SignUpWithReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [referralProcessed, setReferralProcessed] = useState(false);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    // Try cookie first, then localStorage as backup
    const code = getReferralCodeFromCookie() || getReferralCodeFromLocalStorage();

    if (code) {
      setReferralCode(code);
      // Also store in localStorage as backup
      try {
        localStorage.setItem(REFERRAL_COOKIE_NAME, code);
      } catch {
        // Ignore localStorage errors
      }
      console.log(`[SignUp] Found referral code: ${code}`);
    }

    setIsReady(true);
  }, []);

  // Process referral after successful signup
  const processReferral = useCallback(async (userId: string, code: string) => {
    try {
      console.log(`[SignUp] Processing referral for user ${userId} with code ${code}`);
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code }),
      });

      if (response.ok) {
        console.log('[SignUp] Referral processed successfully');
        clearReferralCode();
      } else {
        const data = await response.json();
        console.log(`[SignUp] Referral processing failed: ${data.error}`);
      }
    } catch (error) {
      console.error('[SignUp] Error processing referral:', error);
    }
  }, []);

  // When user signs in (after completing signup), process the referral
  useEffect(() => {
    if (isSignedIn && user && referralCode && !referralProcessed) {
      setReferralProcessed(true);
      processReferral(user.id, referralCode);
    }
  }, [isSignedIn, user, referralCode, referralProcessed, processReferral]);

  // Wait until we've checked for referral code before rendering
  // This prevents a flash where SignUp renders without the metadata
  if (!isReady) {
    return null;
  }

  return (
    <SignUp
      unsafeMetadata={referralCode ? { referralCode } : undefined}
    />
  );
}

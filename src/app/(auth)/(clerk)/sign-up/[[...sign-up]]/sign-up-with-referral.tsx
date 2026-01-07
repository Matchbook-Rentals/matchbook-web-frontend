"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";

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

export function SignUpWithReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

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

import { NextRequest, NextResponse } from 'next/server';
import { findUserByReferralCode, isValidReferralCode } from '@/lib/referral';

const REFERRAL_COOKIE_NAME = 'referral_code';
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const redirectUrl = new URL('/hosts', request.url);

  // Always redirect to /hosts, even if code is invalid (graceful degradation)
  const response = NextResponse.redirect(redirectUrl);

  // Validate and set cookie if code is valid
  if (isValidReferralCode(code)) {
    const referrer = await findUserByReferralCode(code);

    if (referrer) {
      // Set the referral code cookie
      response.cookies.set(REFERRAL_COOKIE_NAME, code.toUpperCase(), {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        // httpOnly: false so client JS can read it for localStorage backup
        httpOnly: false,
      });

      console.log(`[Referral] Set referral cookie for code: ${code.toUpperCase()}`);
    } else {
      console.log(`[Referral] No user found for code: ${code}`);
    }
  } else {
    console.log(`[Referral] Invalid referral code format: ${code}`);
  }

  return response;
}

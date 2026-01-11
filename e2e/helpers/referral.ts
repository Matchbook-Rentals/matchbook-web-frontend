import { Page, APIRequestContext } from '@playwright/test';

/**
 * Get a user's referral code via the dev API
 */
export async function getReferralCode(
  request: APIRequestContext,
  email: string
): Promise<string | null> {
  const response = await request.get(`/api/dev/users?search=${encodeURIComponent(email)}`);
  const data = await response.json();

  if (data.users && data.users.length > 0) {
    return data.users[0].referralCode || null;
  }
  return null;
}

/**
 * Get referral stats from the dev API
 */
export async function getReferralStats(request: APIRequestContext) {
  const response = await request.get('/api/dev/referral-utils');
  return response.json();
}

/**
 * Find a referral by the referred user's email
 */
export async function findReferralByEmail(
  request: APIRequestContext,
  referredEmail: string
): Promise<any | null> {
  const response = await request.get('/api/dev/seed-referrals');
  const data = await response.json();

  if (data.referrals) {
    return data.referrals.find(
      (r: any) => r.referredHost?.email === referredEmail
    ) || null;
  }
  return null;
}

/**
 * Delete a test user via the dev API
 */
export async function deleteTestUser(
  request: APIRequestContext,
  userId: string
): Promise<boolean> {
  try {
    const response = await request.delete(`/api/dev/users/${userId}`);
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Complete Clerk signup flow with email verification.
 * Uses Clerk's test email format (+clerk_test) which can be verified with code 424242.
 * See: https://clerk.com/docs/guides/development/testing/test-emails-and-phones
 */
export async function completeSignup(
  page: Page,
  email: string,
  password: string = 'MbE2eTest$2026!xQ9'
): Promise<void> {
  // Wait for the Clerk signup form
  await page.waitForSelector('form', { state: 'visible' });

  // Fill first name and last name (required fields)
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');

  // Fill email
  await page.fill('input[name="emailAddress"]', email);

  // Fill password
  await page.fill('input[name="password"]', password);

  // Check terms checkbox - click the label text since checkbox may be hidden
  const termsLabel = page.getByText('I agree to the');
  if (await termsLabel.isVisible()) {
    await termsLabel.click();
  }

  // Submit
  await page.getByRole('button', { name: /continue|sign up/i }).click();

  // Wait for email verification screen
  await page.waitForSelector('text=Verify your email', { timeout: 30000 });

  // Enter the test verification code (424242 for +clerk_test emails)
  // Click on the OTP input area to focus it, then type the code
  const otpContainer = page.locator('[data-otp-input-root]').first();
  if (await otpContainer.isVisible()) {
    await otpContainer.click();
  } else {
    // Fallback: click first input in the form
    const firstInput = page.locator('input').first();
    await firstInput.click();
  }

  // Type the verification code - Clerk auto-submits when all 6 digits are entered
  await page.keyboard.type('424242');

  // Wait for either:
  // 1. Redirect away from signup (success)
  // 2. "Success" indicator appearing (code verified, may redirect soon)
  try {
    await page.waitForURL((url) => !url.pathname.includes('/sign-up'), { timeout: 10000 });
  } catch {
    // If not redirected yet, check if we see "Success" and wait longer
    const success = page.getByText('Success');
    if (await success.isVisible()) {
      // Code was verified, wait for redirect
      await page.waitForURL((url) => !url.pathname.includes('/sign-up'), { timeout: 20000 });
    } else {
      // Re-throw if no success indicator
      throw new Error('Verification did not complete');
    }
  }
}

/**
 * Generate a unique test email using Clerk's test email format.
 * Emails with +clerk_test can be verified with code 424242.
 * See: https://clerk.com/docs/guides/development/testing/test-emails-and-phones
 */
export function generateTestEmail(): string {
  return `test+clerk_test_${Date.now()}@example.com`;
}

/**
 * Simulate a host getting their first booking to qualify their referral.
 * Uses the dev API endpoint which creates test data and calls qualifyReferral.
 */
export async function qualifyReferralForHost(
  request: APIRequestContext,
  hostId: string
): Promise<{
  success: boolean;
  message?: string;
  bookingId?: string;
  referralId?: string;
  status?: string;
}> {
  const response = await request.post('/api/dev/qualify-referral', {
    data: { hostId },
  });
  return response.json();
}

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
 * Complete Clerk signup flow
 */
export async function completeSignup(
  page: Page,
  email: string,
  password: string = 'TestPassword123!'
): Promise<void> {
  // Wait for the Clerk signup form
  await page.waitForSelector('form', { state: 'visible' });

  // Fill email
  await page.fill('input[name="emailAddress"]', email);

  // Click continue
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for password field (Clerk multi-step form)
  await page.waitForSelector('input[name="password"]', { state: 'visible' });

  // Fill password
  await page.fill('input[name="password"]', password);

  // Submit
  await page.getByRole('button', { name: /continue|sign up/i }).click();

  // Wait for navigation away from signup
  await page.waitForURL((url) => !url.pathname.includes('/sign-up'), { timeout: 15000 });
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(): string {
  return `test-referral-${Date.now()}@matchbook-test.com`;
}

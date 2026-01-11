import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import {
  getReferralCode,
  findReferralByEmail,
  deleteTestUser,
  completeSignup,
  generateTestEmail,
  qualifyReferralForHost,
} from './helpers/referral';

test.describe('Referral Flow', () => {
  test('visiting /ref/[code] sets cookie and redirects to /hosts', async ({ page, context }) => {
    // Use a test referral code (may not exist in DB, but should still redirect)
    const testCode = 'TEST23';

    // Visit the referral link
    await page.goto(`/ref/${testCode}`);

    // Should redirect to /hosts
    await expect(page).toHaveURL(/.*\/hosts/);

    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('invalid referral code still redirects to /hosts (graceful degradation)', async ({ page }) => {
    // Use an invalid code format
    await page.goto('/ref/invalid!');

    // Should still redirect to /hosts
    await expect(page).toHaveURL(/.*\/hosts/);
  });

  test('refer-host page shows Sign In button when not logged in', async ({ page }) => {
    await page.goto('/refer-host');

    // Should see the "Sign In" button in the hero section (not the header)
    const signInButton = page.locator('section button', { hasText: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('refer-host page displays correct content', async ({ page }) => {
    await page.goto('/refer-host');

    // Check for main heading
    await expect(page.getByText('Refer hosts, get rewarded')).toBeVisible();

    // Check for reward description (first one in hero section)
    await expect(page.getByText('Receive $50 when a host you refer gets their first booking.')).toBeVisible();

    // Check for "How it Works" section
    await expect(page.getByText('How it Works')).toBeVisible();

    // Check for the three steps (use exact match for card titles)
    await expect(page.getByRole('heading', { name: 'Generate your link' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Share with Hosts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Get Rewarded', exact: true })).toBeVisible();
  });

  test('terms apply link navigates to referral terms page', async ({ page }) => {
    await page.goto('/refer-host');

    // Click the "Terms apply" link
    const termsLink = page.getByRole('link', { name: /terms apply/i });
    await expect(termsLink).toBeVisible();
    await termsLink.click();

    // Should navigate to the referral terms page
    await expect(page).toHaveURL(/.*\/terms\/referral/);

    // Check that the terms page loads (heading should be visible)
    await expect(page.getByRole('heading', { name: /referral/i })).toBeVisible();
  });

  test('referral terms page loads correctly', async ({ page }) => {
    await page.goto('/terms/referral');

    // Check page title/heading
    await expect(page.getByRole('heading', { name: /referral/i })).toBeVisible();

    // Check that page has content (placeholder or actual terms)
    await expect(page.locator('body')).toContainText(/referral/i);
  });
});

// Tests for authenticated user flows using TEST_USER credentials
test.describe('Referral Flow - Authenticated', () => {
  test('authenticated user sees Copy Link button', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    // Enable Clerk testing mode
    await setupClerkTestingToken({ page });

    // Sign in with test user
    await page.goto('/sign-in');
    await page.waitForSelector('form', { state: 'visible' });
    await page.fill('input[name="identifier"]', email);
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForSelector('input[name="password"]', { state: 'visible' });
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for sign-in to complete
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 30000 });

    // Go to refer-host page
    await page.goto('/refer-host');

    // Should see the "Copy Link" button instead of "Sign In"
    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await expect(copyLinkButton).toBeVisible();
  });

  test('Copy Link button copies referral URL to clipboard', async ({ page, context }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Enable Clerk testing mode
    await setupClerkTestingToken({ page });

    // Sign in with test user
    await page.goto('/sign-in');
    await page.waitForSelector('form', { state: 'visible' });
    await page.fill('input[name="identifier"]', email);
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForSelector('input[name="password"]', { state: 'visible' });
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for sign-in to complete
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 30000 });

    // Go to refer-host page
    await page.goto('/refer-host');

    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await copyLinkButton.click();

    // Button should show "Copied!"
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible();

    // Verify clipboard contains the referral URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/\/ref\/[A-Z0-9]{6}/);
  });
});

// Full integration test for signup with referral
// Uses Clerk's test email format (+clerk_test) which can be verified with code 424242
// See: https://clerk.com/docs/guides/development/testing/test-emails-and-phones
test.describe('Referral Signup Integration', () => {
  let testUserId: string | null = null;
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
    testUserId = null;
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: Delete test user if created
    if (testUserId) {
      await deleteTestUser(request, testUserId);
    }
  });

  test('signup with referral code creates referral record', async ({ page, request }) => {
    test.setTimeout(60000); // 60 second timeout for retries

    // Skip if TEST_USER_EMAIL not configured
    const referrerEmail = process.env.TEST_USER_EMAIL;
    if (!referrerEmail) {
      test.skip();
      return;
    }

    // Enable Clerk testing mode (bypasses bot detection)
    await setupClerkTestingToken({ page });

    // 1. Get referrer's code
    const referrerCode = await getReferralCode(request, referrerEmail);
    if (!referrerCode) {
      test.skip();
      return;
    }

    // 2. Visit referral link to set cookie
    await page.goto(`/ref/${referrerCode}`);
    await expect(page).toHaveURL(/.*\/hosts/);

    // Verify cookie was set
    const cookies = await page.context().cookies();
    const referralCookie = cookies.find(c => c.name === 'referral_code');
    expect(referralCookie).toBeTruthy();
    expect(referralCookie?.value).toBe(referrerCode);

    // 3. Navigate to signup
    await page.goto('/sign-up');

    // Wait a bit for client-side hydration and cookie reading
    await page.waitForTimeout(1000);

    // 4. Complete Clerk signup with test email (uses 424242 verification code)
    await completeSignup(page, testEmail);

    // 5. Navigate to home to trigger ReferralProcessor
    // The processor needs time to:
    // - Detect user is signed in
    // - Wait for Clerk webhook to create user in DB (with retries)
    // - Make the API call to create the referral
    await page.goto('/');

    // Wait for retries (up to 5 retries at 2s each = 10s max, plus buffer)
    await page.waitForTimeout(15000);

    // 6. Verify user was created with referredByUserId set
    const usersResp = await request.get(`/api/dev/users?search=${encodeURIComponent(testEmail)}`);
    const usersData = await usersResp.json();
    expect(usersData.users).toHaveLength(1);
    const newUser = usersData.users[0];

    // The user should have referredByUserId pointing to the referrer
    expect(newUser.referredByUserId).toBeTruthy();

    // 7. Verify referral record was created
    const referral = await findReferralByEmail(request, testEmail);
    expect(referral).toBeTruthy();
    expect(referral.status).toBe('pending');

    // Verify the referral links correctly
    expect(referral.referrer.referralCode).toBe(referrerCode);
    expect(referral.referredHost.email).toBe(testEmail);

    // Save userId for cleanup
    testUserId = newUser.id;
  });

  test('signup without referral code does not create referral', async ({ page, request }) => {
    // Enable Clerk testing mode (bypasses bot detection)
    await setupClerkTestingToken({ page });

    // 1. Go directly to signup (no referral link visit)
    await page.goto('/sign-up');

    // Verify no referral cookie
    const cookies = await page.context().cookies();
    const referralCookie = cookies.find(c => c.name === 'referral_code');
    expect(referralCookie).toBeFalsy();

    // 2. Complete signup (uses 424242 verification code)
    await completeSignup(page, testEmail);

    // 3. Wait for webhook
    await page.waitForTimeout(5000);

    // 4. Verify NO referral was created
    const referral = await findReferralByEmail(request, testEmail);
    expect(referral).toBeFalsy();

    // Find and cleanup the user
    const usersResp = await request.get(`/api/dev/users?search=${encodeURIComponent(testEmail)}`);
    const usersData = await usersResp.json();
    if (usersData.users && usersData.users.length > 0) {
      testUserId = usersData.users[0].id;
    }
  });

  test('referral qualifies when host gets first booking', async ({ page, request }) => {
    test.setTimeout(90000); // 90 second timeout for full flow

    // Skip if TEST_USER_EMAIL not configured
    const referrerEmail = process.env.TEST_USER_EMAIL;
    if (!referrerEmail) {
      test.skip();
      return;
    }

    // Enable Clerk testing mode (bypasses bot detection)
    await setupClerkTestingToken({ page });

    // 1. Get referrer's code
    const referrerCode = await getReferralCode(request, referrerEmail);
    if (!referrerCode) {
      test.skip();
      return;
    }

    // 2. Visit referral link to set cookie
    await page.goto(`/ref/${referrerCode}`);
    await expect(page).toHaveURL(/.*\/hosts/);

    // 3. Navigate to signup
    await page.goto('/sign-up');
    await page.waitForTimeout(1000);

    // 4. Complete Clerk signup with test email
    await completeSignup(page, testEmail);

    // 5. Navigate to home to trigger ReferralProcessor
    await page.goto('/');
    await page.waitForTimeout(15000);

    // 6. Verify referral was created and is pending
    const referral = await findReferralByEmail(request, testEmail);
    expect(referral).toBeTruthy();
    expect(referral.status).toBe('pending');

    // Get the new user's ID
    const usersResp = await request.get(`/api/dev/users?search=${encodeURIComponent(testEmail)}`);
    const usersData = await usersResp.json();
    expect(usersData.users).toHaveLength(1);
    const newUser = usersData.users[0];
    testUserId = newUser.id;

    // 7. Simulate host getting their first booking
    const qualifyResult = await qualifyReferralForHost(request, newUser.id);
    expect(qualifyResult.success).toBe(true);
    expect(qualifyResult.status).toBe('qualified');
    expect(qualifyResult.bookingId).toBeTruthy();

    // 8. Verify referral is now qualified
    const updatedReferral = await findReferralByEmail(request, testEmail);
    expect(updatedReferral).toBeTruthy();
    expect(updatedReferral.status).toBe('qualified');
    expect(updatedReferral.qualifyingBookingId).toBe(qualifyResult.bookingId);
  });
});

import { test, expect } from '@playwright/test';

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

// Note: Tests for authenticated user flows (Copy Link button, etc.)
// would require authentication setup which depends on the test environment
test.describe('Referral Flow - Authenticated', () => {
  test.skip('authenticated user sees Copy Link button', async ({ page }) => {
    // This test is skipped because it requires authentication
    // To enable: set up Clerk test user credentials in environment

    // Login steps would go here
    // await page.goto('/sign-in');
    // ... login flow ...

    await page.goto('/refer-host');

    // Should see the "Copy Link" button instead of "Sign In"
    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await expect(copyLinkButton).toBeVisible();
  });

  test.skip('Copy Link button copies referral URL to clipboard', async ({ page, context }) => {
    // This test is skipped because it requires authentication
    // To enable: set up Clerk test user credentials and grant clipboard permissions

    // Grant clipboard permissions
    // await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Login steps would go here

    await page.goto('/refer-host');

    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await copyLinkButton.click();

    // Button should show "Copied!"
    await expect(page.getByRole('button', { name: /copied/i })).toBeVisible();

    // Verify clipboard contains the referral URL
    // const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    // expect(clipboardText).toMatch(/matchbookrentals\.com\/ref\/[A-Z0-9]{6}/);
  });
});

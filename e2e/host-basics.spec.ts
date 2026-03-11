/**
 * Host Basics E2E Tests
 *
 * User Stories:
 *   - host/01-host-dashboard
 *   - host/04-manage-listings
 *   - host/07-message-renters
 *   - host/10-host-settings
 *
 * Tests that hosts can access their dashboard, listings, messages,
 * and settings pages. Requires permanent host test account in e2e/.env.test.
 *
 * More complex host flows (listing creation, applications) are covered
 * in add-property.spec.ts and booking-flow.spec.ts.
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const TEST_HOST = {
  email: process.env.TEST_HOST_EMAIL!,
  password: process.env.TEST_HOST_PASSWORD!,
};

/** Sign in as the permanent host test account. */
async function signInAsHost(page: import('@playwright/test').Page) {
  await setupClerkTestingToken({ page });
  await page.goto('/sign-in');
  await page.waitForSelector('form', { state: 'visible' });
  await page.fill('input[name="identifier"]', TEST_HOST.email);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForSelector('input[name="password"]', { state: 'visible' });
  await page.fill('input[name="password"]', TEST_HOST.password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 15_000 });
  await page.waitForSelector('[data-testid="user-menu-trigger"]', { timeout: 10_000 });
}

test.describe('Host Basics', () => {

  test.beforeEach(async () => {
    test.skip(
      !TEST_HOST.email || !TEST_HOST.password,
      'Host test account not configured in e2e/.env.test'
    );
  });

  // -----------------------------------------------------------------------
  // Story 01: Host Dashboard
  // -----------------------------------------------------------------------
  test('host can access the dashboard', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAsHost(page);
    await page.goto('/app/host/dashboard/overview');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/sign-in');
  });

  // -----------------------------------------------------------------------
  // Story 04: Manage Listings
  // -----------------------------------------------------------------------
  test('host can view listings page', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAsHost(page);
    await page.goto('/app/host/dashboard/listings');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/sign-in');
  });

  // -----------------------------------------------------------------------
  // Story 07: Messages
  // -----------------------------------------------------------------------
  test('host can access messages page', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAsHost(page);
    await page.goto('/app/host/messages');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/sign-in');
  });

  // -----------------------------------------------------------------------
  // Story 10: Settings
  // -----------------------------------------------------------------------
  test('host can access settings page', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAsHost(page);
    await page.goto('/app/host/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/sign-in');
  });
});

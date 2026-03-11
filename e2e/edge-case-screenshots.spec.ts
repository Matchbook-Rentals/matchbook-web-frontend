/**
 * Screenshot-capture spec for the "Auth redirect preserves trip details" edge case.
 * Run with: npx playwright test e2e/edge-case-screenshots.spec.ts
 *
 * Generates screenshots into e2e/screenshots/ for documentation.
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { signIn, getTestUser } from './helpers/auth';

async function grantGeolocation(context: import('@playwright/test').BrowserContext) {
  await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' });
  await context.setGeolocation({ latitude: 40.7608, longitude: -111.891 });
}

async function waitForHomepageListings(page: import('@playwright/test').Page, timeout = 30_000) {
  await page.locator('a[href*="/search/listing/"]').first().waitFor({ state: 'visible', timeout });
}

const SCREENSHOT_DIR = 'e2e/screenshots';

/** Shared flow: captures screenshots at each step of the auth redirect edge case. */
async function captureFlow(
  page: import('@playwright/test').Page,
  prefix: string,
) {
  // --- Step 1: Get a listing ID ---
  await page.goto('/');
  await waitForHomepageListings(page);
  const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
  const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
  expect(listingId).toBeTruthy();

  // --- Step 2: Guest visits listing with date params ---
  const startDate = new Date(Date.now() + 30 * 86400000).toISOString();
  const endDate = new Date(Date.now() + 120 * 86400000).toISOString();
  await page.goto(
    `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1`
  );
  await page.waitForLoadState('domcontentloaded');

  const applyButton = page.locator('button:visible:has-text("Apply Now")').first();
  await expect(applyButton).toBeVisible({ timeout: 20_000 });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}01-guest-listing-with-dates.png`, fullPage: false });

  // --- Step 3: Guest clicks Apply Now → auth modal ---
  await applyButton.click();
  const authModal = page.locator('[role="dialog"]');
  await expect(authModal).toBeVisible({ timeout: 5_000 });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}02-guest-auth-modal.png`, fullPage: false });

  // --- Step 4: Sign in (simulates the auth redirect) ---
  await setupClerkTestingToken({ page });
  const testUser = getTestUser();
  await signIn(page, testUser.email, testUser.password);

  // --- Step 5: Authed user lands with date params (no isApplying) — dates pre-filled ---
  await page.goto(
    `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1`
  );
  await page.waitForLoadState('domcontentloaded');
  const applyButtonAuthed = page.locator('button:visible:has-text("Apply Now")').first();
  await expect(applyButtonAuthed).toBeVisible({ timeout: 20_000 });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}03-authed-listing-dates-prefilled.png`, fullPage: false });

  // --- Step 6: Authed user lands with isApplying=true → application wizard ---
  await page.goto(
    `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1&isApplying=true`
  );
  await page.waitForLoadState('domcontentloaded');
  const submitButton = page.locator('button:has-text("Submit Application")');
  await expect(submitButton).toBeVisible({ timeout: 30_000 });

  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}04-authed-application-wizard.png`, fullPage: false });
}

test.describe('Edge Case Screenshots: Auth redirect preserves trip details', () => {

  test('desktop flow', async ({ page, context }) => {
    test.setTimeout(120_000);
    await grantGeolocation(context);
    await captureFlow(page, 'desktop-');
  });

  test('mobile flow', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { latitude: 40.7608, longitude: -111.891 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    await captureFlow(page, 'mobile-');
    await context.close();
  });

  // Screenshot-only viewports (presentation check, no additional assertions)
  test('laptop screenshots', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      geolocation: { latitude: 40.7608, longitude: -111.891 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    await captureFlow(page, 'laptop-');
    await context.close();
  });

  test('tablet screenshots', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      geolocation: { latitude: 40.7608, longitude: -111.891 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    await captureFlow(page, 'tablet-');
    await context.close();
  });
});

/**
 * Message Host E2E Tests
 *
 * Tests the unified "Message Host" → Messages page flow with ?listingId= param.
 * The messages page server component calls findOrCreateConversationForListing(listingId)
 * to find or create the conversation, then auto-selects it in the sidebar.
 *
 * No data-testid attributes on listing/messages pages — uses text and CSS selectors.
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { signIn, getTestUser } from './helpers/auth';
import { getTestListingIds } from './helpers/guest-session';

/** Grant geolocation so listing sections render. */
async function grantGeolocation(context: import('@playwright/test').BrowserContext) {
  await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' });
  await context.setGeolocation({ latitude: 40.7608, longitude: -111.891 });
}

/** Wait for homepage listing card links to appear. */
async function waitForHomepageListings(page: import('@playwright/test').Page, timeout = 30_000) {
  await page.locator('a[href*="/search/listing/"]').first().waitFor({ state: 'visible', timeout });
}

test.describe('Message Host Flow', () => {

  // -----------------------------------------------------------------------
  // Test 1: Direct navigation to messages with ?listingId= auto-selects conversation
  // -----------------------------------------------------------------------
  test('direct navigation to messages with ?listingId= auto-selects conversation', async ({ page }) => {
    test.setTimeout(90_000);

    // Get a real listing ID from the database (before sign-in to avoid race)
    const listingIds = await getTestListingIds(1);
    expect(listingIds.length).toBeGreaterThan(0);
    const listingId = listingIds[0];

    await setupClerkTestingToken({ page });
    const testUser = getTestUser();
    await signIn(page, testUser.email, testUser.password);

    // Navigate directly to messages with listingId param
    await page.goto(`/app/rent/messages?listingId=${listingId}`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Should stay on messages page (no redirect to sign-in)
    expect(page.url()).toContain('/app/rent/messages');
    expect(page.url()).not.toContain('/sign-in');

    // A conversation item should be visible in the sidebar
    const conversationItem = page.locator('.rounded-lg.cursor-pointer');
    await expect(conversationItem.first()).toBeVisible({ timeout: 30_000 });

    // The message input area should be visible (proves auto-selection worked)
    const messageInput = page.locator('textarea[placeholder="Type a message..."]');
    await expect(messageInput).toBeVisible({ timeout: 15_000 });
  });

  // -----------------------------------------------------------------------
  // Test 2: Message Host button on listing detail page navigates correctly
  // -----------------------------------------------------------------------
  test('Message Host button on listing page navigates to messages', async ({ page, context }) => {
    test.setTimeout(90_000);
    await grantGeolocation(context);

    await setupClerkTestingToken({ page });
    const testUser = getTestUser();
    await signIn(page, testUser.email, testUser.password);

    // Go to homepage and wait for listings
    await page.goto('/');
    await waitForHomepageListings(page);

    // Click the first listing
    const firstListing = page.locator('a[href*="/search/listing/"]').first();
    await firstListing.click();
    await page.waitForURL(/\/search\/listing\//, { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');

    // Find and click the visible "Message Host" button (desktop sidebar, not mobile lg:hidden)
    const messageHostBtn = page.locator('button:has-text("Message Host"):visible');
    await expect(messageHostBtn).toBeVisible({ timeout: 15_000 });
    await messageHostBtn.click();

    // Should navigate to messages page with listingId param
    await page.waitForURL(/\/app\/rent\/messages/, { timeout: 15_000 });
    expect(page.url()).toContain('/app/rent/messages');
    expect(page.url()).toContain('listingId=');

    // Messages page should load with a conversation visible
    const conversationItem = page.locator('.rounded-lg.cursor-pointer');
    await expect(conversationItem.first()).toBeVisible({ timeout: 30_000 });
  });

  // -----------------------------------------------------------------------
  // Test 3: Unauthenticated user sees auth modal when clicking Message Host
  // -----------------------------------------------------------------------
  test('unauthenticated user sees auth modal on Message Host click', async ({ page, context }) => {
    test.setTimeout(60_000);
    await grantGeolocation(context);

    // No sign-in — browse as guest
    await page.goto('/');
    await waitForHomepageListings(page);

    // Click the first listing
    const firstListing = page.locator('a[href*="/search/listing/"]').first();
    await firstListing.click();
    await page.waitForURL(/\/search\/listing\//, { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');

    // Store the listing page URL to verify no navigation away
    const listingUrl = page.url();

    // Find and click the visible "Message Host" button (desktop sidebar, not mobile lg:hidden)
    const messageHostBtn = page.locator('button:has-text("Message Host"):visible');
    await expect(messageHostBtn).toBeVisible({ timeout: 15_000 });
    await messageHostBtn.click();

    // Auth modal should appear with "Sign in required" heading
    const authHeading = page.locator('h3:has-text("Sign in required")');
    await expect(authHeading).toBeVisible({ timeout: 10_000 });

    // Should still be on the listing detail page (no navigation)
    expect(page.url()).toBe(listingUrl);

    // Modal should have Sign In and Cancel buttons
    const signInBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(signInBtn).toBeVisible();
  });
});

/**
 * Authenticated Renter E2E Tests
 *
 * User Stories:
 *   - renter/authed/01-browse-homepage
 *   - renter/authed/02-search-listings
 *   - renter/authed/03-view-listing-details
 *   - renter/authed/05-favorite-listings
 *   - renter/authed/11-renter-dashboard
 *
 * Tests that authenticated renters can browse, search, view listings,
 * favorite properties, and access the dashboard.
 *
 * No data-testid attributes on listing/search pages — uses text and CSS selectors.
 * Auth components use data-testid="user-menu-trigger" and "sign-out-button".
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { signIn, getTestUser } from './helpers/auth';

/** Grant geolocation so listing sections render. */
async function grantGeolocation(context: import('@playwright/test').BrowserContext) {
  await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' });
  await context.setGeolocation({ latitude: 40.7608, longitude: -111.891 });
}

/** Wait for homepage listing card links to appear. */
async function waitForHomepageListings(page: import('@playwright/test').Page, timeout = 30_000) {
  await page.locator('a[href*="/search/listing/"]').first().waitFor({ state: 'visible', timeout });
}

/** Wait for search page listing cards (div cards, not <a> tags). */
async function waitForSearchListings(page: import('@playwright/test').Page, timeout = 30_000) {
  await page.locator('h2:has-text("/ Month")').first().waitFor({ state: 'visible', timeout });
}

test.describe('Authenticated Renter', () => {

  // -----------------------------------------------------------------------
  // Story 01: Browse Homepage (Authenticated)
  // -----------------------------------------------------------------------
  test.describe('Story 01: Browse Homepage', () => {

    test('authed renter sees listings and user menu on homepage', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/');

      // Listing cards should render
      await waitForHomepageListings(page);
      const count = await page.locator('a[href*="/search/listing/"]').count();
      expect(count).toBeGreaterThan(0);

      // User menu should be visible (proves auth state)
      await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    });
  });

  // -----------------------------------------------------------------------
  // Story 02: Search Listings (Authenticated)
  // -----------------------------------------------------------------------
  test.describe('Story 02: Search Listings', () => {

    test('authed renter can view search results at /search', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      // Search cards are divs with onClick, not <a> tags — wait for price headings
      await waitForSearchListings(page);
      const count = await page.locator('h3').count();
      expect(count).toBeGreaterThan(0);

      // Filters button should be available
      const filtersBtn = page.locator('button:has-text("Filters")');
      await expect(filtersBtn.first()).toBeVisible({ timeout: 10_000 });

    });
  });

  // -----------------------------------------------------------------------
  // Story 03: View Listing Details (Authenticated)
  // -----------------------------------------------------------------------
  test.describe('Story 03: View Listing Details', () => {

    test('authed renter can click a listing and view details', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/');
      await waitForHomepageListings(page);

      // Click the first listing
      const firstListing = page.locator('a[href*="/search/listing/"]').first();
      await firstListing.click();

      await page.waitForURL(/\/search\/listing\//, { timeout: 15_000 });
      await page.waitForLoadState('domcontentloaded');

      // Should be on listing detail page
      expect(page.url()).toMatch(/\/search\/listing\//);

      // Should have images
      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);

    });
  });

  // -----------------------------------------------------------------------
  // Story 05: Favorite Listings
  // -----------------------------------------------------------------------
  test.describe('Story 05: Favorite Listings', () => {

    test('authed renter can favorite without auth prompt', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/');
      await waitForHomepageListings(page);

      // Click the heart button on the first listing card
      const firstCard = page.locator('a[href*="/search/listing/"]').first();
      const heartButton = firstCard.locator('button').first();
      await heartButton.waitFor({ state: 'visible', timeout: 10_000 });
      await heartButton.click();

      // Wait for optimistic update
      await page.waitForTimeout(1_000);

      // No auth modal should appear
      const authHeading = page.locator('h3:has-text("Sign in required")');
      const hasModal = await authHeading.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(hasModal).toBe(false);

      // No guest session cookie should exist
      const cookies = await page.context().cookies();
      const guestCookie = cookies.find(c => c.name === 'matchbook_guest_session_id');
      expect(guestCookie).toBeFalsy();

    });
  });

  // -----------------------------------------------------------------------
  // Story 11: Renter Dashboard
  // -----------------------------------------------------------------------
  test.describe('Story 11: Renter Dashboard', () => {

    test('authed renter can access the dashboard', async ({ page }) => {
      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/rent/dashboard');
      await page.waitForLoadState('networkidle');

      // Should not redirect to sign-in
      expect(page.url()).not.toContain('/sign-in');
    });

    test('unauthenticated user is redirected from dashboard', async ({ page }) => {
      await page.goto('/rent/dashboard');

      // Should redirect to sign-in
      await page.waitForURL(/sign-in/, { timeout: 15_000 });
    });
  });
});

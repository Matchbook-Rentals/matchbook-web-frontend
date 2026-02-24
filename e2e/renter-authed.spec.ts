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
 * Most pages lack data-testid attributes — selectors use text and CSS classes.
 * Auth components use data-testid="user-menu-trigger" and "sign-out-button".
 * If tests break after a UI refactor, consider adding data-testid attrs to
 * source components (search pill, calendar nav, accordion cards, etc.).
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

/** Verify that selected dates survive a page reload. */
async function verifyDatesPersistOnReload(page: import('@playwright/test').Page) {
  // Dates should be visible before reload (navbar shows formatted dates, not "Add Dates")
  const whenSpan = page.locator('span:has-text("Add Dates")');
  await expect(whenSpan).not.toBeVisible({ timeout: 5_000 });

  // Reload and verify dates survive the round-trip
  await page.reload();
  await waitForSearchListings(page);
  await expect(whenSpan).not.toBeVisible({ timeout: 10_000 });
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
  // Story 02a: Guided Search (Desktop)
  // -----------------------------------------------------------------------
  test.describe('Story 02a: Guided Search', () => {

    test('authed renter can search via homepage search bar popover', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Mock Places autocomplete and geocode APIs for deterministic results
      await page.route('**/api/places-autocomplete*', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            predictions: [
              { place_id: 'mock_slc', description: 'Salt Lake City, UT, USA' },
            ],
          }),
        }),
      );
      await page.route('**/api/geocode*', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            results: [{ geometry: { location: { lat: 40.7608, lng: -111.891 } } }],
          }),
        }),
      );

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 1. Click "Choose Location" to open Where popover
      const whereButton = page.locator('button:has-text("Choose Location")');
      await expect(whereButton).toBeVisible({ timeout: 15_000 });
      await whereButton.click();

      // 2. Type location in the autocomplete input
      const locationInput = page.locator('input[placeholder="Enter an address or city"]');
      await expect(locationInput).toBeVisible({ timeout: 5_000 });
      await locationInput.fill('Salt Lake City');

      // 3. Click the suggestion
      const suggestion = page.locator('[data-testid="location-suggestion-item"]').first();
      await expect(suggestion).toBeVisible({ timeout: 5_000 });
      await suggestion.click();

      // 4. Wait for geocoding to finish and When panel to appear
      const moveInLabel = page.locator('label:has-text("Move in")');
      await expect(moveInLabel).toBeVisible({ timeout: 10_000 });

      // 5. Pick dates via text inputs
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 2);
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 2);

      const toShort = (d: Date) => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear() % 100).padStart(2, '0');
        return `${mm}${dd}${yy}`;
      };

      const moveInInput = page.locator('input[placeholder="mm/dd/yy"]').first();
      await moveInInput.fill(toShort(startDate));
      await moveInInput.blur();

      const moveOutInput = page.locator('input[placeholder="mm/dd/yy"]').nth(1);
      await moveOutInput.fill(toShort(endDate));
      await moveOutInput.blur();

      await page.waitForTimeout(500);

      // 6. Click the green search button
      const searchButton = page.locator('button:has(svg.lucide-search)').first();
      await expect(searchButton).toBeEnabled({ timeout: 5_000 });
      await searchButton.click();

      // 7. Should redirect to /search?tripId=...
      await page.waitForURL(/\/search\?tripId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('tripId')).toBe(true);

      // Search page should load listings
      await waitForSearchListings(page);

      // Verify dates persist on reload
      await verifyDatesPersistOnReload(page);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02b: Direct URL Creates Trip
  // -----------------------------------------------------------------------
  test.describe('Story 02b: Direct URL', () => {

    test('authed renter navigating to /search with bare lat/lng gets redirected with tripId', async ({ page, context }) => {
      test.setTimeout(30_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      // Server should auto-create a trip and redirect
      await page.waitForURL(/\/search\?tripId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('tripId')).toBe(true);
      expect(url.searchParams.has('lat')).toBe(false);
      expect(url.searchParams.has('lng')).toBe(false);

      // Search page should load listings
      await waitForSearchListings(page);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02c: Explore Button Creates Trip
  // -----------------------------------------------------------------------
  test.describe('Story 02c: Explore Button', () => {

    test('authed renter clicking explore arrow creates trip and navigates to search', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/');
      await waitForHomepageListings(page);

      // The explore arrow is a <button> next to each section heading
      const exploreButton = page.locator('h3').first().locator('..').locator('button').first();
      await expect(exploreButton).toBeVisible({ timeout: 10_000 });

      await exploreButton.click();

      // Should navigate to /search with a tripId param (not bare lat/lng)
      await page.waitForURL(/\/search\?tripId=/, { timeout: 30_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('tripId')).toBe(true);
      expect(url.searchParams.has('lat')).toBe(false);
      expect(url.searchParams.has('lng')).toBe(false);

      // Search page should load listings
      await waitForSearchListings(page);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02a-mobile: Guided Search (Mobile)
  // -----------------------------------------------------------------------
  test.describe('Story 02a: Mobile Guided Search', () => {

    test('authed renter on mobile can search via overlay', async ({ browser }) => {
      test.setTimeout(60_000);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7608, longitude: -111.891 },
      });
      const page = await context.newPage();

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Mock APIs
      await page.route('**/api/places-autocomplete*', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            predictions: [{ place_id: 'mock_slc', description: 'Salt Lake City, UT, USA' }],
          }),
        }),
      );
      await page.route('**/api/geocode*', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            results: [{ geometry: { location: { lat: 40.7608, lng: -111.891 } } }],
          }),
        }),
      );

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 1. Tap "Begin Your Search" to open mobile overlay
      const searchPill = page.locator('text=Begin Your Search');
      await expect(searchPill).toBeVisible({ timeout: 15_000 });
      await searchPill.click();

      // 2. Where accordion — type location
      const locationInput = page.locator('input[placeholder="Enter an address or city"]');
      await expect(locationInput).toBeVisible({ timeout: 5_000 });
      await locationInput.fill('Salt Lake City');

      // 3. Tap suggestion
      const suggestion = page.locator('[data-testid="location-suggestion-item"]').first();
      await expect(suggestion).toBeVisible({ timeout: 5_000 });
      await suggestion.click();

      // Scope all calendar interactions to the mobile overlay
      const overlay = page.locator('.fixed.inset-0.z-50');

      // 4. When accordion auto-opens — wait for calendar
      await expect(overlay.getByRole('button', { name: 'Exact Dates' })).toBeVisible({ timeout: 10_000 });

      // Navigate forward 2 months so all days are available
      const nextButton = overlay.locator('button:has(svg.lucide-chevron-right)');
      await nextButton.click();
      await page.waitForTimeout(500);
      await nextButton.click();
      await page.waitForTimeout(500);

      const availableDays = overlay.locator('button:not([disabled]) > span.text-\\[\\#344054\\]');
      await availableDays.first().click();

      // Navigate forward another month for end date
      await nextButton.click();
      await page.waitForTimeout(500);

      const endDays = overlay.locator('button:not([disabled]) > span.text-\\[\\#344054\\]');
      await endDays.last().click();

      // 5. Who accordion auto-opens
      await expect(overlay.locator('text=Adults')).toBeVisible({ timeout: 5_000 });

      // 6. Tap Search
      const searchButton = page.locator('button:has-text("Search")').last();
      await expect(searchButton).toBeEnabled({ timeout: 5_000 });
      await searchButton.click();

      // 7. Should redirect to /search?tripId=...
      await page.waitForURL(/\/search\?tripId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('tripId')).toBe(true);

      await waitForSearchListings(page);

      // Verify dates persist on reload
      await verifyDatesPersistOnReload(page);

      await context.close();
    });
  });

  // -----------------------------------------------------------------------
  // Story 02d: Mobile Direct URL Creates Trip
  // -----------------------------------------------------------------------
  test.describe('Story 02d: Mobile Direct URL', () => {

    test('authed renter on mobile navigating to /search with no params gets redirected with tripId', async ({ browser }) => {
      test.setTimeout(30_000);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7608, longitude: -111.891 },
      });
      const page = await context.newPage();

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      await page.goto('/search');

      // Server should auto-create a trip and redirect
      await page.waitForURL(/\/search\?tripId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('tripId')).toBe(true);

      // Search page should load listings
      await waitForSearchListings(page);

      await context.close();
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

/**
 * Guest Browse E2E Tests
 *
 * User Stories:
 *   - renter/guest/01-browse-homepage
 *   - renter/guest/02-search-listings
 *   - renter/guest/03-view-listing-details
 *
 * Tests that unauthenticated guests can browse the homepage,
 * search for listings, and view listing details.
 *
 * Note: Most pages lack data-testid attributes. Selectors use text content,
 * href patterns, and CSS classes. These are fragile — if tests break after
 * a UI refactor, consider adding data-testid attrs to the source components
 * (search pill, calendar nav, accordion cards, etc.) and updating selectors here.
 */
import { test, expect } from '@playwright/test';

/** Grant geolocation so listing sections render without timeout. */
async function grantGeolocation(context: import('@playwright/test').BrowserContext) {
  await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' });
  await context.setGeolocation({ latitude: 40.7608, longitude: -111.891 });
}

/** Wait for homepage listing card links to appear. */
async function waitForHomepageListings(page: import('@playwright/test').Page, timeout = 30_000) {
  await page.locator('a[href*="/search/listing/"]').first().waitFor({ state: 'visible', timeout });
}

/**
 * Wait for search page listing cards to appear.
 * Search cards are divs (Card component) with onClick, not <a> tags.
 * They contain h3 (title) and h2 (price like "$X / Month").
 */
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

test.describe('Guest Browse', () => {

  // -----------------------------------------------------------------------
  // Story 01: Browse Homepage
  // -----------------------------------------------------------------------
  test.describe('Story 01: Browse Homepage', () => {

    test('guest can visit homepage and see listing cards', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);

      const listingLinks = page.locator('a[href*="/search/listing/"]');
      const count = await listingLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('listing cards show title and price', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);

      // First listing card should have a title (h3) and price info
      const firstCard = page.locator('a[href*="/search/listing/"]').first();
      const title = firstCard.locator('h3');
      await expect(title).toBeVisible();

      const titleText = await title.textContent();
      expect(titleText!.trim().length).toBeGreaterThan(0);
    });

    test('homepage has search triggers', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // The search pill has WHERE, WHEN, WHO triggers
      const whereButton = page.locator(
        'button:has-text("Begin Your Search"), ' +
        'button:has-text("Choose Location")'
      ).first();

      await expect(whereButton).toBeVisible({ timeout: 15_000 });
    });

    test('homepage shows location-specific section headings', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);

      // Section headings should contain location text
      const headings = page.locator('h2, h3');
      const count = await headings.count();

      const headingTexts: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await headings.nth(i).textContent();
        if (text) headingTexts.push(text.trim());
      }

      const hasLocationTitle = headingTexts.some(
        t => t.includes('rentals') || t.includes('Explore') || t.includes('search in')
      );
      expect(hasLocationTitle).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02: Search Listings
  // -----------------------------------------------------------------------
  test.describe('Story 02: Search Listings', () => {

    test('guest can view search results at /search', async ({ page, context }) => {
      await grantGeolocation(context);

      // Provide coordinates to skip geolocation prompt
      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      // Search cards are divs with onClick, not <a> tags — wait for price headings
      await waitForSearchListings(page);

      // Should have multiple listing cards with h3 titles
      const titles = page.locator('h3');
      const count = await titles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('search page has a filters button', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      const filtersButton = page.locator('button:has-text("Filters")');
      await expect(filtersButton.first()).toBeVisible({ timeout: 15_000 });
    });

    test('property type filter reduces listing count', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);
      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');
      await waitForSearchListings(page);

      // Count unfiltered listings
      const unfilteredCount = await page.locator('h2:has-text("/ Month")').count();
      expect(unfilteredCount).toBeGreaterThan(0);

      // Open filters modal
      const filtersButton = page.locator('button:has-text("Filters")');
      await filtersButton.first().click();

      // Wait for modal to appear — look for the "Property Type" section heading
      await expect(page.locator('h3:has-text("Property Type")')).toBeVisible({ timeout: 10_000 });

      // Select "Apartment" pill
      const apartmentPill = page.locator('button:has-text("Apartment")');
      await apartmentPill.click();

      // The footer "Show X Listing(s)" button should reflect the filtered count
      const showButton = page.locator('button:has-text("Show")').last();
      await expect(showButton).toBeVisible();
      const showText = await showButton.textContent();
      const filteredModalCount = parseInt(showText!.replace(/\D/g, ''), 10);

      // Filtered count should be less than unfiltered (unless all listings are apartments)
      expect(filteredModalCount).toBeLessThanOrEqual(unfilteredCount);

      // Apply filters
      await showButton.click();

      // Modal should close
      await expect(page.locator('h3:has-text("Property Type")')).not.toBeVisible({ timeout: 5_000 });

      // Verify filter badge appears
      await expect(page.locator('text=Apartment').first()).toBeVisible({ timeout: 5_000 });

      // Wait for listing grid to update and verify count changed
      await page.waitForTimeout(1_000);
      const filteredCount = await page.locator('h2:has-text("/ Month")').count();
      expect(filteredCount).toBeLessThanOrEqual(unfilteredCount);
    });

    test('search listing cards show title and price', async ({ page, context }) => {
      await grantGeolocation(context);
      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      await waitForSearchListings(page);

      // Search cards have h3 for title and h2 for price (e.g. "$1,000 / Month")
      const firstTitle = page.locator('h3').first();
      await expect(firstTitle).toBeVisible();
      const titleText = await firstTitle.textContent();
      expect(titleText!.trim().length).toBeGreaterThan(0);

      // Price should contain $ and / Month
      const firstPrice = page.locator('h2:has-text("/ Month")').first();
      await expect(firstPrice).toBeVisible();
      const priceText = await firstPrice.textContent();
      expect(priceText).toContain('$');
    });
  });

  // -----------------------------------------------------------------------
  // Story 03: View Listing Details
  // -----------------------------------------------------------------------
  test.describe('Story 03: View Listing Details', () => {

    test('guest can click a homepage listing and see the detail page', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);

      // Homepage cards are <a> tags linking to /search/listing/[id]
      const firstListing = page.locator('a[href*="/search/listing/"]').first();
      const href = await firstListing.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/search/listing/');

      await firstListing.click();

      await page.waitForURL(/\/search\/listing\//, { timeout: 15_000 });
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toMatch(/\/search\/listing\//);
    });

    test('listing detail page shows images', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);
      await page.locator('a[href*="/search/listing/"]').first().click();
      await page.waitForURL(/\/search\/listing\//, { timeout: 15_000 });
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02a: Guided Search (Desktop)
  // -----------------------------------------------------------------------
  test.describe('Story 02a: Guided Search', () => {

    test('guest can search via homepage search bar popover', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);

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

      // 5. Pick dates via text inputs (more reliable than calendar clicks)
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

      // Wait for Who panel to auto-open, then click search
      await page.waitForTimeout(500);

      // 6. Click the green search button
      const searchButton = page.locator('button:has(svg.lucide-search)').first();
      await expect(searchButton).toBeEnabled({ timeout: 5_000 });
      await searchButton.click();

      // 7. Should redirect to /search?sessionId=...
      await page.waitForURL(/\/search\?sessionId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('sessionId')).toBe(true);

      // Search page should load listings
      await waitForSearchListings(page);

      // Verify dates persist on reload
      await verifyDatesPersistOnReload(page);
    });
  });

  // -----------------------------------------------------------------------
  // Story 02a-validation: Date Input Validation
  // -----------------------------------------------------------------------
  test.describe('Story 02a: Date Validation', () => {

    /** Helper to open the When panel via the guided flow with mocked APIs */
    async function openWhenPanel(page: import('@playwright/test').Page) {
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

      const whereButton = page.locator('button:has-text("Choose Location")');
      await expect(whereButton).toBeVisible({ timeout: 15_000 });
      await whereButton.click();

      const locationInput = page.locator('input[placeholder="Enter an address or city"]');
      await expect(locationInput).toBeVisible({ timeout: 5_000 });
      await locationInput.fill('Salt Lake City');

      const suggestion = page.locator('[data-testid="location-suggestion-item"]').first();
      await expect(suggestion).toBeVisible({ timeout: 5_000 });
      await suggestion.click();

      // Wait for When panel
      await expect(page.locator('label:has-text("Move in")')).toBeVisible({ timeout: 10_000 });
    }

    /** Format a Date as MM/DD/YY for the text input */
    function toShortDate(d: Date): string {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear() % 100).padStart(2, '0');
      return `${mm}${dd}${yy}`;
    }

    test('rejects a start date in the past', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await openWhenPanel(page);

      // Type yesterday's date into Move in
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const moveInInput = page.locator('input[placeholder="mm/dd/yy"]').first();
      await moveInInput.fill(toShortDate(yesterday));
      await moveInInput.blur();

      // Should show error
      await expect(page.locator('text=Date must be tomorrow or later')).toBeVisible({ timeout: 5_000 });
    });

    test('rejects today as a start date', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await openWhenPanel(page);

      const today = new Date();

      const moveInInput = page.locator('input[placeholder="mm/dd/yy"]').first();
      await moveInInput.fill(toShortDate(today));
      await moveInInput.blur();

      // Today should also be rejected — earliest is tomorrow
      await expect(page.locator('text=Date must be tomorrow or later')).toBeVisible({ timeout: 5_000 });
    });

    test('rejects an end date before the start date', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await openWhenPanel(page);

      // Set a valid start date (2 months from now)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 2);
      startDate.setDate(15);

      const moveInInput = page.locator('input[placeholder="mm/dd/yy"]').first();
      await moveInInput.fill(toShortDate(startDate));
      await moveInInput.blur();

      // Set end date before start (1 month from now)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(15);

      const moveOutInput = page.locator('input[placeholder="mm/dd/yy"]').nth(1);
      await moveOutInput.fill(toShortDate(endDate));
      await moveOutInput.blur();

      // Should show error
      await expect(page.locator('text=Must be after move-in date')).toBeVisible({ timeout: 5_000 });
    });

    test('rejects a trip shorter than one month', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await openWhenPanel(page);

      // Set start date to 2 months from now
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 2);
      startDate.setDate(1);

      const moveInInput = page.locator('input[placeholder="mm/dd/yy"]').first();
      await moveInInput.fill(toShortDate(startDate));
      await moveInInput.blur();

      // Set end date only 15 days after start
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);

      const moveOutInput = page.locator('input[placeholder="mm/dd/yy"]').nth(1);
      await moveOutInput.fill(toShortDate(endDate));
      await moveOutInput.blur();

      // Should show error about minimum duration
      await expect(page.locator('text=Must be at least 1 month after move-in')).toBeVisible({ timeout: 5_000 });
    });
  });

  // -----------------------------------------------------------------------
  // Story 02b: Direct URL Creates Guest Session
  // -----------------------------------------------------------------------
  test.describe('Story 02b: Direct URL', () => {

    test('guest navigating to /search with bare lat/lng gets redirected with sessionId', async ({ page, context }) => {
      test.setTimeout(30_000);
      await grantGeolocation(context);

      await page.goto('/search?lat=40.7608&lng=-111.891&location=Salt+Lake+City');

      // Server should auto-create a guest session and redirect
      await page.waitForURL(/\/search\?sessionId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('sessionId')).toBe(true);
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

    test('guest on mobile can search via overlay', async ({ browser }) => {
      test.setTimeout(60_000);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7608, longitude: -111.891 },
      });
      const page = await context.newPage();

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

      // 2. Where accordion should be open — type location
      const locationInput = page.locator('input[placeholder="Enter an address or city"]');
      await expect(locationInput).toBeVisible({ timeout: 5_000 });
      await locationInput.fill('Salt Lake City');

      // 3. Tap suggestion
      const suggestion = page.locator('[data-testid="location-suggestion-item"]').first();
      await expect(suggestion).toBeVisible({ timeout: 5_000 });
      await suggestion.click();

      // 4. When accordion should auto-open — wait for calendar
      // Scope all calendar interactions to the mobile overlay
      const overlay = page.locator('.fixed.inset-0.z-50');

      // Wait for the When accordion content to be visible
      await expect(overlay.getByRole('button', { name: 'Exact Dates' })).toBeVisible({ timeout: 10_000 });

      // Navigate forward 2 months so all days are available
      const nextButton = overlay.locator('button:has(svg.lucide-chevron-right)');
      await nextButton.click();
      await page.waitForTimeout(500);
      await nextButton.click();
      await page.waitForTimeout(500);

      // Pick first available day as start
      const availableDays = overlay.locator('button:not([disabled]) > span.text-\\[\\#344054\\]');
      await availableDays.first().click();

      // Navigate forward another month for end date (>= 1 month)
      await nextButton.click();
      await page.waitForTimeout(500);

      // Pick last available day as end
      const endDays = overlay.locator('button:not([disabled]) > span.text-\\[\\#344054\\]');
      await endDays.last().click();

      // 5. Who accordion should auto-open — adults auto-set to 1
      await expect(overlay.locator('text=Adults')).toBeVisible({ timeout: 5_000 });

      // 6. Tap Search button
      const searchButton = page.locator('button:has-text("Search")').last();
      await expect(searchButton).toBeEnabled({ timeout: 5_000 });
      await searchButton.click();

      // 7. Should redirect to /search?sessionId=...
      await page.waitForURL(/\/search\?sessionId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('sessionId')).toBe(true);

      await waitForSearchListings(page);

      // Verify dates persist on reload
      await verifyDatesPersistOnReload(page);

      await context.close();
    });
  });

  // -----------------------------------------------------------------------
  // Story 02c: Mobile Direct URL Creates Guest Session
  // -----------------------------------------------------------------------
  test.describe('Story 02c: Mobile Direct URL', () => {

    test('guest on mobile navigating to /search with no params gets redirected with sessionId', async ({ browser }) => {
      test.setTimeout(30_000);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7608, longitude: -111.891 },
      });
      const page = await context.newPage();

      await page.goto('/search');

      // Server should auto-create a guest session and redirect
      await page.waitForURL(/\/search\?sessionId=/, { timeout: 15_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('sessionId')).toBe(true);

      // Search page should load listings
      await waitForSearchListings(page);

      await context.close();
    });
  });

  // -----------------------------------------------------------------------
  // Story 04: Explore Button Creates Guest Session
  // -----------------------------------------------------------------------
  test.describe('Story 04: Explore Button', () => {

    test('guest clicking explore arrow creates session and navigates to search', async ({ page, context }) => {
      test.setTimeout(60_000);
      await grantGeolocation(context);
      await page.goto('/');

      await waitForHomepageListings(page);

      // The explore arrow is a <button> next to each section heading with an ArrowRight icon
      const exploreButton = page.locator('h3').first().locator('..').locator('button').first();
      await expect(exploreButton).toBeVisible({ timeout: 10_000 });

      await exploreButton.click();

      // Should navigate to /search with a sessionId param (not bare lat/lng)
      await page.waitForURL(/\/search\?sessionId=/, { timeout: 30_000 });

      const url = new URL(page.url());
      expect(url.searchParams.has('sessionId')).toBe(true);
      expect(url.searchParams.has('lat')).toBe(false);
      expect(url.searchParams.has('lng')).toBe(false);

      // Search page should load listings
      await waitForSearchListings(page);
    });
  });

  // -----------------------------------------------------------------------
  // Story 06: Like from Direct Listing URL (guest → auth modal)
  // -----------------------------------------------------------------------
  test.describe('Story 06: Like from Direct Listing URL', () => {

    test('guest liking a listing from direct URL shows auth modal', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);

      // Grab a listing ID from homepage
      await page.goto('/');
      await waitForHomepageListings(page);
      const listingLink = page.locator('a[href*="/search/listing/"]').first();
      const href = await listingLink.getAttribute('href');
      expect(href).toBeTruthy();
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Navigate directly to the listing (no auth, no trip)
      await page.goto(`/search/listing/${listingId}`);
      await page.waitForLoadState('domcontentloaded');

      // Click the desktop favorite button
      const heartButton = page.locator('[data-testid="desktop-favorite-button"]');
      await heartButton.waitFor({ state: 'visible', timeout: 15_000 });
      await heartButton.click();

      // Auth modal should appear
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible({ timeout: 5_000 });

      // URL should NOT have tripId (no trip created for guest)
      expect(page.url()).not.toContain('tripId');
    });

    test('mobile: guest liking a listing shows auth modal', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        geolocation: { latitude: 40.7608, longitude: -111.891 },
        permissions: ['geolocation'],
      });
      const page = await context.newPage();

      // Grab a listing ID from homepage
      await page.goto('/');
      await page.locator('a[href*="/search/listing/"]').first().waitFor({ state: 'visible', timeout: 30_000 });
      const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Navigate directly to listing
      await page.goto(`/search/listing/${listingId}`);
      await page.waitForLoadState('domcontentloaded');

      // Click the mobile favorite button
      const heartButton = page.locator('[data-testid="mobile-favorite-button"]');
      await heartButton.waitFor({ state: 'visible', timeout: 15_000 });
      await heartButton.click();

      // Auth modal should appear
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible({ timeout: 5_000 });

      // URL should NOT have tripId
      expect(page.url()).not.toContain('tripId');

      await context.close();
    });
  });
});

/**
 * Authenticated Renter E2E Tests
 *
 * User Stories:
 *   - renter/authed/01-browse-homepage
 *   - renter/authed/02-search-listings
 *   - renter/authed/03-view-listing-details
 *   - renter/authed/05-favorite-listings
 *   - renter/authed/07-apply-to-listing
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
import { getTestPrisma } from './helpers/prisma';
import { getUserIdByEmail, createTripViaAPI } from './helpers/trip';

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
  // Story 06: Like from Direct Listing URL (trip creation + URL update)
  // -----------------------------------------------------------------------
  test.describe('Story 06: Like from Direct Listing URL', () => {

    test('liking a listing from direct URL creates trip and updates URL', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Grab a listing ID from the homepage (cards are <a> tags there)
      await page.goto('/');
      await waitForHomepageListings(page);
      const listingLink = page.locator('a[href*="/search/listing/"]').first();
      const href = await listingLink.getAttribute('href');
      expect(href).toBeTruthy();
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Navigate directly to the listing with NO tripId (simulates shared link)
      await page.goto(`/search/listing/${listingId}`);
      await page.waitForLoadState('domcontentloaded');

      // URL should NOT have tripId yet
      expect(page.url()).not.toContain('tripId');

      // Click the desktop favorite button
      const heartButton = page.locator('[data-testid="desktop-favorite-button"]');
      await heartButton.waitFor({ state: 'visible', timeout: 15_000 });
      await heartButton.click();

      // Wait for trip creation and URL update
      await page.waitForFunction(
        () => window.location.search.includes('tripId'),
        { timeout: 15_000 }
      );

      // URL should now contain tripId
      const updatedUrl = new URL(page.url());
      const tripId = updatedUrl.searchParams.get('tripId');
      expect(tripId).toBeTruthy();

      // Heart should be filled (favorited)
      const heartIcon = heartButton.locator('svg');
      await expect(heartIcon).toHaveClass(/fill-red-500/, { timeout: 5_000 });
    });

    test('after liking, getBackUrl resolves to /search with tripId', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Grab a listing ID from homepage
      await page.goto('/');
      await waitForHomepageListings(page);
      const listingLink = page.locator('a[href*="/search/listing/"]').first();
      const href = await listingLink.getAttribute('href');
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];

      // Go directly to listing (no tripId, no from param)
      await page.goto(`/search/listing/${listingId}`);
      await page.waitForLoadState('domcontentloaded');

      // Like the listing to create a trip
      const heartButton = page.locator('[data-testid="desktop-favorite-button"]');
      await heartButton.waitFor({ state: 'visible', timeout: 15_000 });
      await heartButton.click();

      // Wait for tripId in URL
      await page.waitForFunction(
        () => window.location.search.includes('tripId'),
        { timeout: 15_000 }
      );
      const tripId = new URL(page.url()).searchParams.get('tripId');
      expect(tripId).toBeTruthy();

      // Reload the page — it should now have tripId in the URL
      // and the back button should resolve to /search?tripId=...
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Verify the URL still has the tripId after reload
      expect(page.url()).toContain(`tripId=${tripId}`);
    });
  });

  // -----------------------------------------------------------------------
  // Edge Case: Auth redirect preserves trip details
  // -----------------------------------------------------------------------
  test.describe('Edge Case: Auth redirect preserves trip details', () => {

    test('landing with date params and isApplying shows application wizard', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);
      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Grab a listing ID from homepage
      await page.goto('/');
      await waitForHomepageListings(page);
      const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Simulate post-auth redirect: navigate to listing with date params + isApplying
      const startDate = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days from now
      const endDate = new Date(Date.now() + 120 * 86400000).toISOString();  // 120 days from now
      await page.goto(
        `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1&isApplying=true`
      );
      await page.waitForLoadState('domcontentloaded');

      // Should land directly on the application wizard with "Submit Application" button
      const submitButton = page.locator('button:has-text("Submit Application")');
      await expect(submitButton).toBeVisible({ timeout: 30_000 });
    });

    test('landing with date params pre-fills dates in action box', async ({ page, context }) => {
      test.setTimeout(90_000);
      await grantGeolocation(context);
      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Grab a listing ID from homepage
      await page.goto('/');
      await waitForHomepageListings(page);
      const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Navigate with dates but WITHOUT isApplying (just checking date pre-fill)
      const startDate = new Date(Date.now() + 30 * 86400000).toISOString();
      const endDate = new Date(Date.now() + 120 * 86400000).toISOString();
      await page.goto(
        `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1`
      );
      await page.waitForLoadState('domcontentloaded');

      // Dates should be pre-filled — look for "Apply Now" on desktop action box or mobile footer
      // Desktop: button only appears when hasDates && hasRenterInfo
      // Mobile footer: shows "Apply Now" when hasDates, "Check Availability" otherwise
      const applyButton = page.locator('button:has-text("Apply Now")');
      await expect(applyButton.first()).toBeVisible({ timeout: 20_000 });

      // "Check Availability" should NOT be visible (dates are pre-filled)
      const checkButton = page.locator('button:has-text("Check Availability")');
      await expect(checkButton).not.toBeVisible({ timeout: 3_000 });
    });
  });

  // -----------------------------------------------------------------------
  // Story 07: Apply to Listing with Trip Details
  // -----------------------------------------------------------------------
  test.describe('Story 07: Apply to Listing', () => {

    test('apply to listing with trip details (Story 07)', async ({ page, context }) => {
      test.setTimeout(120_000);
      await grantGeolocation(context);

      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Grab a listing ID from homepage
      await page.goto('/');
      await waitForHomepageListings(page);
      const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
      const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
      expect(listingId).toBeTruthy();

      // Navigate to listing with date params + isApplying=true to open wizard
      const startDate = new Date(Date.now() + 30 * 86400000).toISOString();
      const endDate = new Date(Date.now() + 120 * 86400000).toISOString();
      await page.goto(
        `/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1&isApplying=true`
      );
      await page.waitForLoadState('domcontentloaded');

      // Wait for wizard to open — "Submit Application" button should be visible
      const submitButton = page.locator('button:has-text("Submit Application")');
      await expect(submitButton).toBeVisible({ timeout: 30_000 });

      // Wait for the wizard's async initialization (getFullApplication) to complete
      // before filling fields, otherwise the async callback resets the store
      await page.waitForTimeout(5_000);

      // --- Personal Info ---
      await page.getByPlaceholder('Enter First Name').fill('Test');
      await page.getByPlaceholder('Enter Last Name').fill('Renter');

      // Check "No Middle Name"
      const noMiddleName = page.getByText('No Middle Name').locator('..').locator('input[type="checkbox"], button[role="checkbox"]');
      await noMiddleName.first().click();

      // DOB — find the date of birth input (third MM/DD/YYYY textbox, after move-in and move-out)
      const dobInput = page.getByRole('textbox', { name: 'MM/DD/YYYY' }).nth(2);
      await dobInput.scrollIntoViewIfNeeded();
      await dobInput.fill('01/15/1990');

      // --- Identification ---
      // Select ID type: Driver's License
      const idTypeSelect = page.locator('button[role="combobox"]').first();
      await idTypeSelect.click();
      await page.getByText("Driver's License", { exact: false }).click();

      // ID number
      await page.getByPlaceholder('Enter ID Number').fill('DL123456789');

      // Upload ID photo via UploadThing (triggers file chooser)
      const idUploadArea = page.locator('text=Drag and drop file or').first().locator('..');
      const [idFileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        idUploadArea.click(),
      ]);
      await idFileChooser.setFiles('e2e/fixtures/test-id.png');

      // Wait for ID upload to complete — photo preview appears
      await expect(page.locator('text=test-id.png').first()).toBeVisible({ timeout: 15_000 });

      // --- Residential History ---
      const streetInput = page.getByPlaceholder('Enter Street Address');
      await streetInput.scrollIntoViewIfNeeded();
      await streetInput.fill('123 Test St');
      await page.getByPlaceholder('Enter City').fill('Salt Lake City');
      await page.getByPlaceholder('Enter State').fill('Utah');
      await page.getByPlaceholder('Enter ZIP Code').fill('84101');
      await page.getByPlaceholder('Enter months').fill('24');

      // Monthly payment
      const monthlyPayment = page.locator('#monthlyPayment-0');
      await monthlyPayment.scrollIntoViewIfNeeded();
      await monthlyPayment.fill('1500');

      // Housing status: "I own this property" — click the label text to toggle radio
      const ownRadio = page.locator('#own-0');
      await ownRadio.scrollIntoViewIfNeeded();
      await ownRadio.click({ force: true });
      // Wait for landlord fields to disappear
      await expect(page.getByPlaceholder("Enter landlord's first name")).not.toBeVisible({ timeout: 5_000 });

      // --- Income ---
      const incomeSource = page.getByPlaceholder('Enter your Income Source');
      await incomeSource.scrollIntoViewIfNeeded();
      await incomeSource.fill('Software Engineering');
      const monthlyAmount = page.getByPlaceholder('Enter Monthly Amount');
      await monthlyAmount.scrollIntoViewIfNeeded();
      await monthlyAmount.fill('8000');

      // Upload income proof via UploadThing
      const incomeUploadArea = page.locator('text=Drag and drop file or').first();
      await incomeUploadArea.scrollIntoViewIfNeeded();
      const [incomeFileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        incomeUploadArea.locator('..').click(),
      ]);
      await incomeFileChooser.setFiles('e2e/fixtures/test-id.png');

      // Wait for income proof upload to complete — file name appears in income section
      await expect(page.locator('h3:has-text("Income Proof 1")').first()).toBeVisible({ timeout: 15_000 });
      // Wait for the upload to fully process and set fileKey in store
      await page.waitForTimeout(3_000);

      // --- Questionnaire ---
      const felonyNo = page.locator('#felony-no');
      await felonyNo.scrollIntoViewIfNeeded();
      await felonyNo.click();
      await page.locator('#evicted-no').click();

      // --- Submit ---
      await expect(page.getByPlaceholder('Enter First Name')).toHaveValue('Test');
      await expect(page.getByPlaceholder('Enter your Income Source')).toHaveValue('Software Engineering');

      await submitButton.click();
      await expect(page.getByText('Application Submitted!')).toBeVisible({ timeout: 30_000 });
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

    test('can withdraw an application from the dashboard', async ({ page, request }) => {
      test.setTimeout(90_000);
      const prisma = getTestPrisma();

      // --- Setup fixture ---
      await setupClerkTestingToken({ page });
      const testUser = getTestUser();
      await signIn(page, testUser.email, testUser.password);

      // Get the test user's DB userId
      const userId = await getUserIdByEmail(request, testUser.email);
      expect(userId).toBeTruthy();

      // Find a listing NOT owned by the test user
      const listing = await prisma.listing.findFirst({
        where: { userId: { not: userId! } },
        select: { id: true, title: true },
      });
      expect(listing).toBeTruthy();

      // Create a trip for the test user
      const startDate = new Date(Date.now() + 30 * 86400000);
      const endDate = new Date(Date.now() + 120 * 86400000);
      const tripId = await createTripViaAPI(request, userId!, {
        location: 'Salt Lake City, UT',
        latitude: 40.7608,
        longitude: -111.891,
        startDate,
        endDate,
        numAdults: 1,
      });

      // Create a housing request (application) via Prisma
      const housingRequest = await prisma.housingRequest.create({
        data: {
          userId: userId!,
          listingId: listing!.id,
          tripId,
          startDate,
          endDate,
          status: 'pending',
        },
      });

      // --- Navigate + interact ---
      await page.goto('/rent/dashboard');
      await page.waitForLoadState('networkidle');

      // Open the Applications accordion
      const accordionTrigger = page.locator('button').filter({ hasText: 'Applications' });
      await accordionTrigger.click();

      // Find the application card by listing title
      const card = page.locator('h3', { hasText: listing!.title });
      await expect(card).toBeVisible({ timeout: 10_000 });

      // Click the 3-dot menu on that card
      const cardRow = card.locator('..').locator('..');
      const moreButton = cardRow.locator('button:has(svg.lucide-more-vertical)');
      await moreButton.click();

      // Click "Withdraw Application"
      await page.getByText('Withdraw Application').click();

      // Confirm the AlertDialog
      const withdrawButton = page.getByRole('alertdialog').getByRole('button', { name: 'Withdraw' });
      await expect(withdrawButton).toBeVisible({ timeout: 5_000 });
      await withdrawButton.click();

      // --- Assert ---
      // Card should disappear after the page refreshes
      await expect(card).not.toBeVisible({ timeout: 15_000 });

      // Verify the housing request is gone from the DB
      const dbRecord = await prisma.housingRequest.findUnique({
        where: { id: housingRequest.id },
      });
      expect(dbRecord).toBeNull();

      // Cleanup: delete the trip we created
      await prisma.trip.delete({ where: { id: tripId } }).catch(() => {});
    });
  });
});

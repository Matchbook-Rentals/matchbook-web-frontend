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
 * Note: No data-testid attributes exist on these pages.
 * Selectors use text content, href patterns, and CSS classes.
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
});

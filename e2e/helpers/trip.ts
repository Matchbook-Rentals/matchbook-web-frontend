// Helper functions for trip/search creation in E2E tests
import { Page, APIRequestContext, expect } from '@playwright/test';

export interface TripData {
  location: string;
  latitude?: number;
  longitude?: number;
  startDate?: Date;
  endDate?: Date;
  numAdults?: number;
  numChildren?: number;
  numPets?: number;
}

export const TEST_HOST = {
  email: process.env.TEST_HOST_EMAIL!,
  password: process.env.TEST_HOST_PASSWORD!
};

export const TEST_RENTER = {
  email: process.env.TEST_RENTER_EMAIL!,
  password: process.env.TEST_RENTER_PASSWORD!
};

/**
 * Create a trip via the search dialog on the homepage
 * For authenticated users, this creates a Trip in the database
 */
export async function createTrip(page: Page, tripData: TripData): Promise<string> {
  // Navigate to homepage
  await page.goto('/');

  // Wait for the search inputs to be available
  // Try desktop first, then mobile
  const desktopSearchInput = page.locator('input[placeholder="Where to?"]').first();
  const mobileSearchButton = page.getByTestId('mobile-search-trigger');

  const isDesktop = await desktopSearchInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (isDesktop) {
    await createTripDesktop(page, tripData);
  } else if (await mobileSearchButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createTripMobile(page, tripData);
  } else {
    // Try clicking a search dialog trigger
    const searchTrigger = page.getByRole('button', { name: /search|find/i }).first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
      await createTripDialog(page, tripData);
    } else {
      throw new Error('Could not find search input or dialog trigger');
    }
  }

  // Wait for navigation to the trip page
  await page.waitForURL(/\/app\/rent\/searches\/[a-z0-9-]+/i, { timeout: 15000 });

  // Extract and return the trip ID from URL
  const url = page.url();
  const tripId = extractTripIdFromUrl(url);

  if (!tripId) {
    throw new Error(`Failed to extract trip ID from URL: ${url}`);
  }

  return tripId;
}

/**
 * Create trip using desktop search inputs
 */
async function createTripDesktop(page: Page, tripData: TripData): Promise<void> {
  // Click on location input
  const locationInput = page.locator('input[placeholder="Where to?"]').first();
  await locationInput.click();

  // Type location and select from suggestions
  await fillLocation(page, tripData.location);

  // Click on date input and set dates if provided
  if (tripData.startDate || tripData.endDate) {
    const moveInInput = page.locator('input[placeholder="Move in"]').first();
    await moveInInput.click();
    await fillDateRange(page, tripData.startDate, tripData.endDate);
  }

  // Set guests if provided
  if (tripData.numAdults || tripData.numChildren || tripData.numPets) {
    const guestsInput = page.locator('input[placeholder*="guest"]').first();
    if (await guestsInput.isVisible()) {
      await guestsInput.click();
      await fillGuests(page, tripData);
    }
  }

  // Click search button
  const searchButton = page.getByRole('button', { name: /search/i }).first();
  await searchButton.click();
}

/**
 * Create trip using mobile search trigger
 */
async function createTripMobile(page: Page, tripData: TripData): Promise<void> {
  // Click mobile search trigger to open dialog
  await page.getByTestId('mobile-search-trigger').click();

  // Wait for dialog to open
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });

  await createTripDialog(page, tripData);
}

/**
 * Create trip using the search dialog
 */
async function createTripDialog(page: Page, tripData: TripData): Promise<void> {
  // Fill location
  await fillLocation(page, tripData.location);

  // Fill dates if provided
  if (tripData.startDate || tripData.endDate) {
    await fillDateRange(page, tripData.startDate, tripData.endDate);
  }

  // Fill guests if provided
  if (tripData.numAdults || tripData.numChildren || tripData.numPets) {
    await fillGuests(page, tripData);
  }

  // Click search/submit button
  const submitButton = page.getByRole('button', { name: /search|find|submit/i }).first();
  await submitButton.click();
}

/**
 * Fill location in the search component
 */
async function fillLocation(page: Page, location: string): Promise<void> {
  // Look for location input in various forms
  const locationInput = page.locator('input[placeholder*="Where"], input[placeholder*="location"], input[placeholder*="city"]').first();

  if (await locationInput.isVisible()) {
    await locationInput.fill(location);

    // Wait for suggestions to appear
    await page.waitForTimeout(1000);

    // Click on first suggestion
    const suggestion = page.locator('[role="option"], [data-suggestion], .suggestion-item').first();
    if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      // Try clicking on any list item that contains our location text
      const listItem = page.locator(`text=${location}`).first();
      if (await listItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await listItem.click();
      }
    }
  }
}

/**
 * Fill date range in the search component
 */
async function fillDateRange(page: Page, startDate?: Date, endDate?: Date): Promise<void> {
  // Default to dates 1-3 months from now if not provided
  const start = startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  // Click on a date in the calendar
  // This is a simplified implementation - actual implementation may need to navigate months
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Try to find and click dates in calendar
  const startDateButton = page.getByRole('button', { name: new RegExp(start.getDate().toString()) }).first();
  if (await startDateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startDateButton.click();
  }

  // Click end date
  const endDateButton = page.getByRole('button', { name: new RegExp(end.getDate().toString()) }).first();
  if (await endDateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await endDateButton.click();
  }
}

/**
 * Fill guest counts in the search component
 */
async function fillGuests(page: Page, tripData: TripData): Promise<void> {
  // Look for guest counter inputs
  const { numAdults = 1, numChildren = 0, numPets = 0 } = tripData;

  // Find and set adult count
  const adultIncrement = page.locator('[data-testid="adults-increment"], button:has-text("Adults") + button').first();
  if (await adultIncrement.isVisible({ timeout: 2000 }).catch(() => false)) {
    for (let i = 1; i < numAdults; i++) {
      await adultIncrement.click();
    }
  }

  // Find and set children count
  if (numChildren > 0) {
    const childrenIncrement = page.locator('[data-testid="children-increment"]').first();
    if (await childrenIncrement.isVisible({ timeout: 1000 }).catch(() => false)) {
      for (let i = 0; i < numChildren; i++) {
        await childrenIncrement.click();
      }
    }
  }

  // Find and set pets count
  if (numPets > 0) {
    const petsIncrement = page.locator('[data-testid="pets-increment"]').first();
    if (await petsIncrement.isVisible({ timeout: 1000 }).catch(() => false)) {
      for (let i = 0; i < numPets; i++) {
        await petsIncrement.click();
      }
    }
  }
}

/**
 * Extract trip ID from URL
 */
function extractTripIdFromUrl(url: string): string | null {
  const match = url.match(/\/searches\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Navigate to a specific trip page
 */
export async function navigateToTrip(page: Page, tripId: string): Promise<void> {
  await page.goto(`/app/rent/searches/${tripId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Get trip details via dev API
 */
export async function getTripById(
  request: APIRequestContext,
  tripId: string
): Promise<any | null> {
  const response = await request.get(`/api/dev/trips?id=${tripId}`);
  const data = await response.json();

  if (data.trips && data.trips.length > 0) {
    return data.trips[0];
  }
  return null;
}

/**
 * Get all trips for a user via dev API
 */
export async function getUserTrips(
  request: APIRequestContext,
  userId: string
): Promise<any[]> {
  const response = await request.get(`/api/dev/trips?userId=${userId}`);
  const data = await response.json();
  return data.trips || [];
}

/**
 * Favorite a listing from the trip search results
 */
export async function favoriteListing(page: Page, listingId?: string): Promise<void> {
  // If listingId provided, find that specific listing
  if (listingId) {
    const listingCard = page.locator(`[data-listing-id="${listingId}"]`).first();
    const favoriteButton = listingCard.locator('[data-testid="favorite-button"], button[aria-label*="favorite"]').first();
    await favoriteButton.click();
  } else {
    // Click the first available favorite button
    const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="favorite"]').first();
    await favoriteButton.click();
  }

  // Wait for the action to complete
  await page.waitForTimeout(500);
}

/**
 * Navigate to favorites tab on trip page
 */
export async function navigateToFavorites(page: Page, tripId: string): Promise<void> {
  await page.goto(`/app/rent/searches/${tripId}/favorites`);
  await page.waitForLoadState('networkidle');
}

/**
 * Check if a listing is in the user's favorites
 */
export async function isListingFavorited(page: Page, listingId: string): Promise<boolean> {
  const favoriteCard = page.locator(`[data-listing-id="${listingId}"]`).first();
  const isFavorited = await favoriteCard.locator('[data-favorited="true"]').isVisible({ timeout: 2000 }).catch(() => false);
  return isFavorited;
}

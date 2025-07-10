import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Map Stability Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await loginAsUser(page);
  });

  test('Map should maintain position and zoom when liking/disliking listings', async ({ page }) => {
    // Navigate to search page with map
    await page.goto('/app/searches');
    
    // Switch to map tab
    await page.getByRole('tab', { name: /map/i }).click();
    
    // Wait for map to be visible
    await page.waitForSelector('.map-container', { timeout: 5000 });
    
    // Get initial map state (using data attribute we added)
    const mapElement = await page.locator('.map-container');
    const initialCenter = await mapElement.getAttribute('data-center');
    
    // Find a listing card and like it
    const firstListingCard = await page.locator('.listing-card').first();
    await firstListingCard.hover();
    
    // Click the like button
    const likeButton = await firstListingCard.locator('.like-button');
    await likeButton.click();
    
    // Wait for any animations or state updates to complete
    await page.waitForTimeout(500);
    
    // Get updated map state
    const newCenter = await mapElement.getAttribute('data-center');
    
    // Verify map position hasn't changed
    expect(newCenter).toBe(initialCenter);
  });

  test('Mobile map should maintain stability during interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to search page with map on mobile
    await page.goto('/app/searches');
    
    // Switch to map tab
    await page.getByRole('tab', { name: /map/i }).click();
    
    // Wait for map to be visible
    await page.waitForSelector('.map-container', { timeout: 5000 });
    
    // Get initial map state
    const mapElement = await page.locator('.map-container');
    const initialCenter = await mapElement.getAttribute('data-center');
    
    // Interact with a listing
    const mobileListingCard = await page.locator('.mobile-listing-card').first();
    await mobileListingCard.click();
    
    // Wait for any animations or updates
    await page.waitForTimeout(500);
    
    // Like a listing
    const mobileActionButton = await page.locator('.like-button-mobile');
    await mobileActionButton.click();
    
    // Wait for any animations or state updates to complete
    await page.waitForTimeout(500);
    
    // Get updated map state
    const newCenter = await mapElement.getAttribute('data-center');
    
    // Verify map position hasn't changed
    expect(newCenter).toBe(initialCenter);
  });

  test('Full map workflows should function correctly with new architecture', async ({ page }) => {
    // Navigate to search page
    await page.goto('/app/searches');
    
    // Switch to map tab
    await page.getByRole('tab', { name: /map/i }).click();
    
    // Wait for map to load
    await page.waitForSelector('.map-container', { timeout: 5000 });
    
    // 1. Interact with map - zoom in
    await page.locator('button:has-text("+")').click();
    await page.waitForTimeout(500);
    
    // Save the zoom state
    const mapElement = await page.locator('.map-container');
    const zoomAfterZoomIn = await mapElement.getAttribute('data-zoom');
    
    // 2. Like a listing
    const firstListingCard = await page.locator('.listing-card').first();
    await firstListingCard.hover();
    const likeButton = await firstListingCard.locator('.like-button');
    await likeButton.click();
    
    // 3. Switch tabs
    await page.getByRole('tab', { name: /favorites/i }).click();
    await page.waitForTimeout(500);
    
    // 4. Switch back to map tab
    await page.getByRole('tab', { name: /map/i }).click();
    await page.waitForTimeout(500);
    
    // 5. Verify map state is preserved
    const zoomAfterTabSwitch = await mapElement.getAttribute('data-zoom');
    
    // Map should maintain zoom level after tab switch
    expect(zoomAfterTabSwitch).toBe(zoomAfterZoomIn);
    
    // 6. Verify liked listing appears with correct styling
    const likedMarker = await page.locator('.marker-liked');
    expect(await likedMarker.count()).toBeGreaterThan(0);
  });
});
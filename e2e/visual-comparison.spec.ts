import { test, expect } from '@playwright/test';

test.describe('Visual Comparison - Homepage Listings Grid', () => {
  test('capture listings section screenshot for comparison', async ({ page }) => {
    // Set viewport to consistent size
    await page.setViewportSize({ width: 1280, height: 900 });

    // Go to the newnew page
    await page.goto('/newnew', { waitUntil: 'domcontentloaded' });

    // Wait a bit for content to render
    await page.waitForTimeout(3000);

    // Take full page screenshot regardless of content
    await page.screenshot({
      path: 'ui-samples/screenshot-newnew-full.png',
      fullPage: true
    });

    // Also capture just the viewport
    await page.screenshot({
      path: 'ui-samples/screenshot-newnew-viewport.png',
    });

    console.log('\nScreenshots saved to ui-samples/');
    console.log('Compare with: ui-samples/search-grid-front-page.png');
  });

  test('capture single listing card', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 400 });
    await page.goto('/temp-card', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Screenshot the card element
    const card = page.locator('a').first();
    await card.screenshot({
      path: 'ui-samples/screenshot-listing-card.png',
    });

    console.log('\nCard screenshot saved to ui-samples/screenshot-listing-card.png');
    console.log('Compare with: ui-samples/Listing card.png');
  });

});

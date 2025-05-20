import { test, expect } from '@playwright/test';

test('basic test - verify Playwright is working', async ({ page }) => {
  // Go to the home page
  await page.goto('/');
  
  // Just check that the page loads without errors
  await expect(page).toHaveURL(/.*\//);
  
  // Take a screenshot as verification
  await page.screenshot({ path: 'homepage.png' });
});
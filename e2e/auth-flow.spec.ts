import { test, expect } from '@playwright/test';
import { signIn, signOut } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test('should successfully sign in and sign out', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open the user menu with retry mechanism
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        await page.waitForTimeout(5000); // Wait 5 seconds
        await page.getByTestId('user-menu-trigger').click();
        break; // Success, exit loop
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error; // Re-throw if max retries exceeded
        }
        console.log(`Retry ${retries}/${maxRetries} - waiting for user menu...`);
      }
    }
    
    // Click Sign In button
    await page.getByTestId('sign-in-button').click();
    
    // Wait for sign-in page to load
    await page.waitForURL('**/sign-in**');
    
    // Use the helper function to sign in
    await signIn(page);
    
    // Verify we're logged in - check for sign out button in menu
    await page.getByTestId('user-menu-trigger').click();
    await expect(page.getByTestId('sign-out-button')).toBeVisible({ timeout: 10000 });
    
    // Test sign out using helper function
    await signOut(page);
    
    // Verify we're logged out - the user menu should show Sign In option again
    await page.getByTestId('user-menu-trigger').click();
    
    // Sign In button should be visible again
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
  });
  
  test('should maintain session across page navigations', async ({ page }) => {
    // Use the helper function to sign in
    await signIn(page);
    
    // Navigate to searches page and verify session persists
    await page.goto('/app/rent/searches');
    await expect(page.getByTestId('your-searches-heading')).toBeVisible();
  });
  
  test('should redirect to sign-in when accessing protected routes while logged out', async ({ page }) => {
    // Try to access a protected route without being logged in
    await page.goto('/app/rent/searches');
    
    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
});

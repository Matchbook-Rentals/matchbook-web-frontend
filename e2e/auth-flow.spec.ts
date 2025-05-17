import { test, expect } from '@playwright/test';
import { signIn, signOut } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test('should successfully sign in and sign out', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open the user menu
    await page.waitForLoadState('networkidle');
    const userMenuButton = page.locator('header').getByRole('button').filter({ hasText: /^$/ });
    await userMenuButton.click();
    
    // Click Sign In button
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for sign-in page to load
    await page.waitForURL('**/sign-in**');
    
    // Use the helper function to sign in
    await signIn(page);
    
    // Verify we're logged in - User Profile button should be visible
    const userProfileButton = page.getByRole('button', { name: 'User Profile' });
    await expect(userProfileButton).toBeVisible({ timeout: 10000 });
    
    // Test sign out using helper function
    await signOut(page);
    
    // Verify we're logged out - the user menu should show Sign In option again
    const userMenuButtonAfterSignOut = page.locator('header').getByRole('button').filter({ hasText: /^$/ });
    await userMenuButtonAfterSignOut.click();
    
    // Sign In button should be visible again
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
  
  test('should maintain session across page navigations', async ({ page }) => {
    // Use the helper function to sign in
    await signIn(page);
    
    // Navigate to different pages and verify session persists
    await page.goto('/platform/trips');
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible();
    
    await page.goto('/platform/messages');
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible();
    
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible();
  });
  
  test('should redirect to sign-in when accessing protected routes while logged out', async ({ page }) => {
    // Try to access a protected route without being logged in
    await page.goto('/platform/dashboard');
    
    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
});
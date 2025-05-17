import { test, expect } from '@playwright/test';

test('sign in and sign out flow', async ({ page }) => {
  // Navigate to home page
  await page.goto('http://localhost:3000/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Open user menu (the button with no text in the header)
  await page.locator('header').getByRole('button').filter({ hasText: /^$/ }).click();
  
  // Click Sign In
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Fill in email
  await page.getByRole('textbox', { name: 'Email address' }).fill('tyler.bennett@matchbookrentals.com');
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Fill in password
  await page.getByRole('textbox', { name: 'Password' }).fill('T-4kHUezF%C_i7p');
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Wait for login to complete
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 10000 });
  
  // Verify logged in - User Profile button should be visible
  await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible({ timeout: 10000 });
  
  // Click on User Profile to open menu
  await page.getByRole('button', { name: 'User Profile' }).click();
  
  // Click Sign Out
  await page.getByRole('button', { name: 'Sign Out' }).click();
  
  // Verify logged out - wait for redirect
  await page.waitForLoadState('networkidle');
  
  // Open user menu again to verify Sign In button is back
  await page.locator('header').getByRole('button').filter({ hasText: /^$/ }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
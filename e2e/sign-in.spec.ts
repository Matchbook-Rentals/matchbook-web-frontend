import { test, expect } from '@playwright/test';

test.describe('Sign In Flow', () => {
  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Navigate to the sign-in page
    await page.goto('/sign-in');

    // Wait for the Clerk sign-in component to load
    // Look for the sign-in container or any element that indicates Clerk is loaded
    await page.waitForSelector('form', { state: 'visible' });

    // Fill in the email field - Clerk uses input[name="identifier"]
    await page.fill('input[name="identifier"]', 'tyler.bennett@matchbookrentals.com');
    
    // Click continue button - using text selector for better reliability
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Wait for password field to appear
    await page.waitForSelector('input[name="password"]', { state: 'visible' });
    
    // Fill in the password field
    await page.fill('input[name="password"]', 'T-4kHUezF%C_i7p');
    
    // Click the sign-in button - after password, it's typically "Continue" or "Sign in"
    const submitButton = page.getByRole('button', { name: /continue|sign in/i });
    await submitButton.click();
    
    // Wait for navigation to dashboard or home page after successful login
    await page.waitForURL((url) => {
      const pathname = url.pathname;
      return pathname.includes('/platform') || 
             pathname.includes('/dashboard') || 
             pathname === '/' ||
             pathname.includes('/home');
    }, { timeout: 10000 });
    
    // Verify that we're logged in by checking for navigation changes or user elements
    // Since we successfully navigated away from sign-in, we're logged in
    expect(page.url()).not.toContain('/sign-in');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the sign-in page
    await page.goto('/sign-in');

    // Wait for the sign-in form to load
    await page.waitForSelector('form', { state: 'visible' });

    // Fill in the email field with invalid email
    await page.fill('input[name="identifier"]', 'invalid@example.com');
    
    // Click continue button
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Wait for error message or password field
    // Clerk might show an error immediately or proceed to password
    const passwordFieldOrError = await Promise.race([
      page.waitForSelector('input[name="password"]', { state: 'visible', timeout: 3000 }).then(() => 'password').catch(() => null),
      page.waitForSelector('[role="alert"], [class*="error"], .cl-formFieldError', { state: 'visible', timeout: 3000 }).then(() => 'error').catch(() => null)
    ]);

    if (passwordFieldOrError === 'password') {
      // Fill in an invalid password
      await page.fill('input[name="password"]', 'wrongpassword');
      
      // Click the sign-in button
      await page.getByRole('button', { name: /continue|sign in/i }).click();
    }
    
    // Check for error message - Clerk shows errors in various ways
    const errorElement = page.locator('[role="alert"], [class*="error"], .cl-formFieldError, .cl-formButtonPrimary__error');
    await expect(errorElement.first()).toBeVisible({ timeout: 5000 });
  });
});
// Helper functions for authentication in tests
import { Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!
};

export async function signIn(
  page: Page, 
  email: string = TEST_USER.email, 
  password: string = TEST_USER.password
) {
  // Navigate to sign-in page
  await page.goto('/sign-in');
  
  // Wait for form to be visible
  await page.waitForSelector('form', { state: 'visible' });
  
  // Fill email - Clerk uses input[name="identifier"]
  await page.fill('input[name="identifier"]', email);
  
  // Click continue
  await page.getByRole('button', { name: /continue/i }).click();
  
  // Wait for password field
  await page.waitForSelector('input[name="password"]', { state: 'visible' });
  
  // Fill password
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  
  // Wait for navigation away from sign-in
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 10000 });
  
  // Wait for the user menu to be available (indicating successful sign-in)
  await page.waitForSelector('[data-testid="user-menu-trigger"]', { timeout: 10000 });
}

export async function signOut(page: Page) {
  // Click on User Profile button
  await page.getByTestId('user-menu-trigger').click();
  
  // Click Sign Out button in the dropdown
  await page.getByTestId('sign-out-button').click({ force: true });
  
  // Wait for sign out to complete
  await page.waitForURL((url) => {
    const pathname = url.pathname;
    return pathname === '/' || pathname.includes('/sign-in');
  }, { timeout: 10000 });
  
  // Wait for the sign-in menu to be available (indicating successful sign-out)
  await page.waitForSelector('[data-testid="user-menu-trigger"]', { timeout: 10000 });
}
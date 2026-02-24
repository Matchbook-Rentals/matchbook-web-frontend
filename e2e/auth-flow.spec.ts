import { test, expect } from '@playwright/test';
import { signIn, signOut } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test('should successfully sign in and sign out', async ({ page }) => {
    await page.goto('/');

    // Open the user menu and click Sign In
    await page.getByTestId('user-menu-trigger').click({ timeout: 15000 });
    await page.getByTestId('sign-in-button').click();

    await page.waitForURL('**/sign-in**');
    await signIn(page);

    // Verify logged in
    await page.getByTestId('user-menu-trigger').click();
    await expect(page.getByTestId('sign-out-button')).toBeVisible({ timeout: 10000 });

    // Sign out — helper waits for redirect and user-menu-trigger to reappear
    await signOut(page);

    // Clerk session invalidation can lag behind the URL redirect.
    // Wait for sign-in-button to appear inside the menu — open the menu first,
    // then close it between retries to avoid toggling.
    await page.waitForTimeout(1500);
    await expect(async () => {
      // Dismiss any open popover by pressing Escape, then open fresh
      await page.keyboard.press('Escape');
      await page.getByTestId('user-menu-trigger').click({ force: true });
      await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000 });
  });

  test('should maintain session across page navigations', async ({ page }) => {
    await signIn(page);

    // Navigate to a protected route and verify no redirect to sign-in
    await page.goto('/app/rent/applications');
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test('should redirect to sign-in when accessing protected routes while logged out', async ({ page }) => {
    await page.goto('/app/rent/applications');
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
});

import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('Add Property Flow', () => {
  // Run serially so the second test picks up the draft from the first
  test.describe.configure({ mode: 'serial' });

  let sharedPage: import('@playwright/test').Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await signIn(sharedPage);
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('new user: should navigate to add-property and fill out first step', async () => {
    const page = sharedPage;

    await page.goto('/app/host/dashboard/listings');

    // Click the Add Property link
    const addPropertyLink = page.getByRole('link', { name: 'Add Property' });
    await expect(addPropertyLink).toBeVisible({ timeout: 10000 });
    await addPropertyLink.click();

    // Should navigate to the add property page
    await expect(page).toHaveURL(/.*\/app\/host\/add-property.*/, { timeout: 10000 });

    // Verify the Next button is present
    await expect(page.getByTestId('next-button')).toBeVisible();

    // Fill out the highlights form
    await page.getByTestId('card-apartment').click();
    await page.getByTestId('card-unfurnished').click();
    await page.getByTestId('card-no-pets').click();

    // Click Next to advance to location step
    await page.getByTestId('next-button').click();

    // Verify we moved to the location step
    await expect(page.getByText('Where is your place located?')).toBeVisible();
    await expect(page).toHaveURL(/.*\/app\/host\/add-property.*/);
    await expect(page.getByTestId('next-button')).toBeVisible();

    // Auto-save should have added draftId to the URL
    await expect(page).toHaveURL(/.*draftId=/, { timeout: 10000 });
  });

  test('auto-save: should persist draft on refresh', async () => {
    const page = sharedPage;

    // Grab the current URL (should have draftId from previous test)
    const urlBeforeRefresh = page.url();
    expect(urlBeforeRefresh).toContain('draftId=');

    // Refresh the page
    await page.reload();

    // Should still have the draftId in the URL
    await expect(page).toHaveURL(/.*draftId=/, { timeout: 10000 });

    // Page reloads at step 0 with draft data pre-populated
    // Verify the highlights selections were persisted
    await expect(page.getByTestId('next-button')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('card-apartment')).toHaveAttribute('data-selected', 'true', { timeout: 5000 });
    await expect(page.getByTestId('card-unfurnished')).toHaveAttribute('data-selected', 'true');
    await expect(page.getByTestId('card-no-pets')).toHaveAttribute('data-selected', 'true');
  });

  test('returning user: should navigate back and resume add-property flow', async () => {
    const page = sharedPage;

    // Go back to listings — user now has a draft from the first test
    await page.goto('/app/host/dashboard/listings');

    // Click Add Property again
    const addPropertyLink = page.getByRole('link', { name: 'Add Property' });
    await expect(addPropertyLink).toBeVisible({ timeout: 10000 });
    await addPropertyLink.click();

    // Should land on add-property page
    await expect(page).toHaveURL(/.*\/app\/host\/add-property.*/, { timeout: 10000 });

    // Verify the page loaded and Next button is present
    await expect(page.getByTestId('next-button')).toBeVisible();
  });
});

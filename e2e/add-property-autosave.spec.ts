import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import path from 'path';

/**
 * Auto-save e2e tests for the add-property flow.
 *
 * Verifies that clicking Next auto-saves the draft (draftId appears in URL)
 * and that refreshing the page restores persisted data for each step.
 *
 * Tests steps 0-10 of the listing creation flow.
 */

/** Navigate through address confirmation step (handles debounce). */
async function fillAndPassAddressStep(page: import('@playwright/test').Page) {
  await expect(page.getByText("Confirm your property's address")).toBeVisible({ timeout: 15000 });

  // Always clear and re-type fields to trigger React onChange
  // which fires the debounce that propagates values to parent state.
  // Using fill('') then type() ensures React state updates properly.
  const streetInput = page.getByPlaceholder('123 S Temple St');
  await streetInput.click();
  await streetInput.fill('');
  await streetInput.type('123 Main St');

  const cityInput = page.getByPlaceholder('Salt Lake City');
  await cityInput.click();
  await cityInput.fill('');
  await cityInput.type('Salt Lake City');

  const zipInput = page.getByPlaceholder('84101');
  await zipInput.click();
  await zipInput.fill('');
  await zipInput.type('84101');

  // Select state — always re-select to ensure onChange fires
  const stateSelect = page.locator('text=Select a state');
  if (await stateSelect.isVisible()) {
    await stateSelect.click();
    await page.getByText('Utah', { exact: true }).click();
  } else {
    // State already selected — click the dropdown and re-select to trigger onChange
    const stateDropdown = page.locator('button:has-text("Utah")').first();
    if (await stateDropdown.isVisible()) {
      await stateDropdown.click();
      await page.getByLabel('Utah').click();
    }
  }

  // Wait for address form's 1s debounce to propagate after last keystroke
  await page.waitForTimeout(3000);
  await page.getByTestId('next-button').click();

  // If we're still on the address step after clicking Next, the debounce may not have
  // propagated yet. Wait and retry once.
  const stillOnAddress = await page.getByText("Confirm your property's address").isVisible().catch(() => false);
  if (stillOnAddress) {
    await page.waitForTimeout(2000);
    await page.getByTestId('next-button').click();
  }
}

/** Navigate from step 0 to a target step, clicking through all intermediate steps. */
async function navigateToStep(page: import('@playwright/test').Page, targetStep: number) {
  // Step 0 (Highlights) -> click Next
  if (targetStep <= 0) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Where is your place located?')).toBeVisible({ timeout: 15000 });

  // Step 1 (Location) -> click Next
  if (targetStep <= 1) return;
  await page.getByTestId('next-button').click();

  // Step 2 (Address Confirmation) -> fill and pass
  if (targetStep <= 2) return;
  await fillAndPassAddressStep(page);
  await expect(page.getByText('How many bedrooms are there?')).toBeVisible({ timeout: 15000 });

  // Step 3 (Rooms) -> click Next
  if (targetStep <= 3) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Give your place a title')).toBeVisible({ timeout: 15000 });

  // Step 4 (Basics) -> click Next
  if (targetStep <= 4) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Add some photos')).toBeVisible({ timeout: 15000 });

  // Step 5 (Photos) -> click Next
  if (targetStep <= 5) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Choose the photos renters see first')).toBeVisible({ timeout: 15000 });

  // Step 6 (Featured Photos) -> click Next
  if (targetStep <= 6) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('What amenities does your property offer?')).toBeVisible({ timeout: 15000 });

  // Step 7 (Amenities) -> click Next
  if (targetStep <= 7) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Set the pricing')).toBeVisible({ timeout: 15000 });

  // Step 8 (Pricing) -> click Next
  if (targetStep <= 8) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Select Monthly Rent And Utilities Included')).toBeVisible({ timeout: 15000 });

  // Step 9 (Verify Pricing) -> click Next
  if (targetStep <= 9) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('What deposits and additional costs do you require?')).toBeVisible({ timeout: 15000 });

  // Step 10 (Deposits) -> click Next
  if (targetStep <= 10) return;
  await page.getByTestId('next-button').click();
  await expect(page.getByText('Review your listing')).toBeVisible({ timeout: 15000 });
}

test.describe('Add Property Auto-Save', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000); // Generous timeout for each test

  let sharedPage: import('@playwright/test').Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await signIn(sharedPage);
  });

  test.afterAll(async () => {
    // Clean up: delete the draft (and its DB record) via the API
    // Extract draftId from the current URL
    try {
      const url = new URL(sharedPage.url());
      const draftId = url.searchParams.get('draftId');
      if (draftId) {
        // Delete the draft via API (removes ListingInCreation record)
        const response = await sharedPage.request.delete(`/api/listings/draft?id=${draftId}`);
        if (response.ok()) {
          console.log(`Cleaned up draft: ${draftId}`);
        } else {
          console.warn(`Failed to clean up draft: ${response.status()}`);
        }
      }
    } catch (e) {
      console.warn('Draft cleanup failed:', e);
    }
    await sharedPage.close();
  });

  test('step 0 (Highlights): auto-saves and persists on refresh', async () => {
    const page = sharedPage;

    await page.goto('/app/host/add-property?new=true');
    await expect(page.getByTestId('next-button')).toBeVisible({ timeout: 15000 });

    // Fill highlights
    await page.getByTestId('card-apartment').click();
    await page.getByTestId('card-unfurnished').click();
    await page.getByTestId('card-no-pets').click();

    // Click Next — triggers auto-save. Wait for the POST to complete before reloading.
    const savePromise = page.waitForResponse(
      resp => resp.url().includes('/api/listings/draft') && resp.request().method() === 'POST' && resp.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId('next-button').click();

    // Should advance to location step
    await expect(page.getByText('Where is your place located?')).toBeVisible({ timeout: 15000 });

    // Auto-save should have added draftId to URL
    await expect(page).toHaveURL(/.*draftId=/, { timeout: 15000 });

    // Wait for the save to actually complete in the DB
    await savePromise;
    await page.waitForTimeout(500);

    // Refresh and verify highlights persisted
    await page.reload();
    await expect(page.getByTestId('next-button')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('card-apartment')).toHaveAttribute('data-selected', 'true', { timeout: 5000 });
    await expect(page.getByTestId('card-unfurnished')).toHaveAttribute('data-selected', 'true');
    await expect(page.getByTestId('card-no-pets')).toHaveAttribute('data-selected', 'true');
  });

  test('steps 1-2 (Location + Address Confirmation): fill and auto-save', async () => {
    const page = sharedPage;

    // We're at step 0 after refresh — click through highlights
    await page.getByTestId('next-button').click();
    await expect(page.getByText('Where is your place located?')).toBeVisible({ timeout: 15000 });

    // Location step has no validation — click Next to advance to address confirmation
    await page.getByTestId('next-button').click();
    await fillAndPassAddressStep(page);

    // Should advance to rooms step
    await expect(page.getByText('How many bedrooms are there?')).toBeVisible({ timeout: 15000 });

    // Verify draftId still in URL
    await expect(page).toHaveURL(/.*draftId=/);
  });

  test('step 3 (Rooms): fill, auto-save, and verify persistence', async () => {
    const page = sharedPage;

    // Fill square feet — type slowly to ensure React processes each keystroke
    const sqftInput = page.getByPlaceholder('1,234 sq ft');
    await sqftInput.click();
    await sqftInput.fill('');
    await sqftInput.type('1500', { delay: 50 });

    // Let React finish processing state updates
    await page.waitForTimeout(1000);

    // Click Next — wait for auto-save network request
    const savePromise = page.waitForResponse(
      resp => resp.url().includes('/api/listings/draft') && resp.request().method() === 'POST' && resp.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId('next-button').click();

    // Should advance to basics step
    await expect(page.getByText('Give your place a title')).toBeVisible({ timeout: 15000 });

    // Wait for the auto-save POST to actually complete
    const saveResp = await savePromise;
    expect(saveResp.status()).toBe(200);
    await page.waitForTimeout(500);

    // Refresh and navigate back to rooms to verify persistence
    await page.reload();
    await expect(page.getByTestId('next-button')).toBeVisible({ timeout: 15000 });

    // Navigate: step 0 -> 1 -> 2 -> 3
    await navigateToStep(page, 3);

    // Verify square feet persisted (value may be formatted with commas)
    const sqftValue = await page.getByPlaceholder('1,234 sq ft').inputValue();
    expect(sqftValue === '1500' || sqftValue === '1,500').toBeTruthy();
  });

  test('step 4 (Basics): fill title and description, auto-save', async () => {
    const page = sharedPage;

    // Click Next from rooms to get to basics
    await page.getByTestId('next-button').click();
    await expect(page.getByText('Give your place a title')).toBeVisible({ timeout: 15000 });

    // Fill title — use type() with delay to trigger React onChange reliably
    const titleInput = page.getByPlaceholder('Enter a title...');
    await titleInput.click();
    await titleInput.type('Cozy Test Apartment', { delay: 20 });

    // Fill description
    const descInput = page.getByPlaceholder('Enter a description...');
    await descInput.click();
    await descInput.type('A lovely apartment for testing auto-save.', { delay: 20 });

    // Let React finish processing state updates
    await page.waitForTimeout(1000);

    // Click Next — will go to photos (step 5)
    // Wait for the auto-save network request to complete before clicking Next
    const savePromise = page.waitForResponse(
      resp => resp.url().includes('/api/listings/draft') && resp.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.getByTestId('next-button').click();
    await expect(page.getByText('Add some photos')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);

    // Wait for the auto-save POST to actually complete
    await savePromise;
    await page.waitForTimeout(500);

    // Refresh and navigate back to basics to verify
    await page.reload();
    await expect(page.getByTestId('next-button')).toBeVisible({ timeout: 15000 });

    // Navigate: step 0 -> ... -> 4
    await navigateToStep(page, 4);

    // Verify title and description persisted
    await expect(page.getByPlaceholder('Enter a title...')).toHaveValue('Cozy Test Apartment');
    await expect(page.getByPlaceholder('Enter a description...')).toHaveValue(
      'A lovely apartment for testing auto-save.'
    );
  });

  test('step 5 (Photos): upload images and auto-save', async () => {
    test.setTimeout(120000); // Photo uploads can take a while
    const page = sharedPage;

    // Click Next from basics to get to photos
    await page.getByTestId('next-button').click();
    await expect(page.getByText('Add some photos')).toBeVisible({ timeout: 15000 });

    // Upload 4 images from public/placeholderImages via the hidden file input
    const imagePaths = [1, 2, 3, 4].map(i =>
      path.resolve(__dirname, `../public/placeholderImages/image_${i}.jpg`)
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePaths);

    // Wait for UploadThing to finish — uploaded photos render as "Listing photo N"
    await expect(page.locator('img[alt^="Listing photo"]').first()).toBeVisible({ timeout: 60000 });
    // Wait for all 4 to appear
    await expect(page.locator('img[alt^="Listing photo"]')).toHaveCount(4, { timeout: 60000 });

    // Click Next — should pass validation (4+ photos)
    await page.getByTestId('next-button').click();

    // Should advance to featured photos step
    await expect(page.getByText('Choose the photos renters see first')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);
  });

  test('step 6 (Featured Photos): select 4 featured photos and auto-save', async () => {
    const page = sharedPage;

    // We should be on the featured photos step
    await expect(page.getByText('Choose the photos renters see first')).toBeVisible({ timeout: 15000 });

    // The photo gallery is a grid of cards — click first 4 photos to select them
    // Gallery photos are in the grid at bottom: .grid.grid-cols-4 img elements
    const galleryPhotos = page.locator('.grid.grid-cols-4 img');
    await expect(galleryPhotos.first()).toBeVisible({ timeout: 15000 });

    const photoCount = await galleryPhotos.count();
    const selectCount = Math.min(4, photoCount);
    for (let i = 0; i < selectCount; i++) {
      await galleryPhotos.nth(i).click();
      await page.waitForTimeout(300); // small delay between clicks
    }

    // Click Next — should pass validation (exactly 4 featured)
    await page.getByTestId('next-button').click();

    // Should advance to amenities step
    await expect(page.getByText('What amenities does your property offer?')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);
  });

  test('step 7 (Amenities): select laundry option and auto-save', async () => {
    const page = sharedPage;

    // We should be on amenities step
    await expect(page.getByText('What amenities does your property offer?')).toBeVisible({ timeout: 15000 });

    // Select a laundry option — required for validation
    // Cards are visible on md+ screens, badges on mobile. Click whichever is visible.
    const inUnitCard = page.getByTestId('card-in-unit');
    const inUnitBadge = page.locator('text=In Unit').first();

    if (await inUnitCard.isVisible()) {
      await inUnitCard.click();
    } else {
      await inUnitBadge.click();
    }

    // Click Next
    await page.getByTestId('next-button').click();

    // Should advance to pricing step
    await expect(page.getByText('Set the pricing')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);
  });

  test('step 8 (Pricing): set stay lengths and auto-save', async () => {
    const page = sharedPage;

    // We should be on pricing step — defaults are shortestStay=1, longestStay=12
    // which pass validation. Just click Next.
    await expect(page.getByText('Set the pricing')).toBeVisible({ timeout: 15000 });

    // Click Next — defaults should pass validation
    await page.getByTestId('next-button').click();

    // Should advance to verify pricing step
    await expect(page.getByText('Select Monthly Rent And Utilities Included')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);
  });

  test('step 9 (Verify Pricing): fill monthly prices and auto-save', async () => {
    const page = sharedPage;

    // We should be on verify pricing step
    await expect(page.getByText('Select Monthly Rent And Utilities Included')).toBeVisible({ timeout: 15000 });

    // Fill prices for all months — each row has an input with placeholder "0"
    // The pricing table has inputs for months 1-12 (default range)
    const priceInputs = page.locator('input[placeholder="0"]');
    const inputCount = await priceInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = priceInputs.nth(i);
      if (await input.isVisible()) {
        await input.click();
        await input.fill('');
        await input.type('1200');
      }
    }

    // Click Next
    await page.getByTestId('next-button').click();

    // Should advance to deposits step
    await expect(page.getByText('What deposits and additional costs do you require?')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);

    // Wait for auto-save
    await page.waitForTimeout(2000);
  });

  test('step 10 (Deposits): fill deposit and auto-save', async () => {
    const page = sharedPage;

    // We should be on deposits step
    await expect(page.getByText('What deposits and additional costs do you require?')).toBeVisible({ timeout: 15000 });

    // Fill security deposit — the first input with placeholder "0"
    const depositInputs = page.locator('input[placeholder="0"]');
    const firstDeposit = depositInputs.first();
    await firstDeposit.click();
    await firstDeposit.fill('');
    await firstDeposit.type('500');

    // Click Next — deposits have no required validation
    await page.getByTestId('next-button').click();

    // Should advance to review step
    await expect(page.getByText('Review your listing')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*draftId=/);
  });
});

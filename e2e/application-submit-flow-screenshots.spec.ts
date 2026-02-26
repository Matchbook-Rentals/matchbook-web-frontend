import { test, expect, Page, BrowserContext } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

const SCREENSHOT_DIR = 'e2e/screenshots';

// Reuse helpers from renter-authed
function getTestUser() {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;
  if (!email || !password) throw new Error('Missing E2E_TEST_USER_EMAIL or E2E_TEST_USER_PASSWORD');
  return { email, password };
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.waitForLoadState('domcontentloaded');
  const emailInput = page.locator('input[name="identifier"]');
  await expect(emailInput).toBeVisible({ timeout: 15_000 });
  await emailInput.fill(email);
  await page.locator('button:has-text("Continue")').click();
  const passwordInput = page.locator('input[name="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  await passwordInput.fill(password);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('input[name="identifier"]')).not.toBeVisible({ timeout: 15_000 });
}

async function grantGeolocation(context: BrowserContext) {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7608, longitude: -111.891 });
}

async function captureFlow(page: Page, context: BrowserContext, prefix: string) {
  await grantGeolocation(context);
  await setupClerkTestingToken({ page });
  const testUser = getTestUser();
  await signIn(page, testUser.email, testUser.password);

  // Get a listing ID
  await page.goto('/');
  await page.locator('a[href*="/search/listing/"]').first().waitFor({ timeout: 30_000 });
  const href = await page.locator('a[href*="/search/listing/"]').first().getAttribute('href');
  const listingId = href!.match(/\/search\/listing\/([^?/]+)/)?.[1];
  expect(listingId).toBeTruthy();

  // Step 1: Listing page with dates (shows Apply Now)
  const startDate = new Date(Date.now() + 30 * 86400000).toISOString();
  const endDate = new Date(Date.now() + 120 * 86400000).toISOString();
  await page.goto(`/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}01-listing-apply.png`, fullPage: false });

  // Navigate to wizard
  await page.goto(`/search/listing/${listingId}?startDate=${startDate}&endDate=${endDate}&numAdults=1&isApplying=true`);
  await page.waitForLoadState('domcontentloaded');
  const submitButton = page.locator('button:has-text("Submit Application")');
  await expect(submitButton).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(5_000);

  // Step 2: Personal Info
  await page.getByPlaceholder('Enter First Name').fill('Test');
  await page.getByPlaceholder('Enter Last Name').fill('Renter');
  const noMiddleName = page.getByText('No Middle Name').locator('..').locator('input[type="checkbox"], button[role="checkbox"]');
  await noMiddleName.first().click();
  // DOB input — check if visible MM/DD/YYYY inputs exist (desktop) or native date input (mobile)
  const visibleDateInputs = page.getByPlaceholder('MM/DD/YYYY').and(page.locator(':visible'));
  const visibleCount = await visibleDateInputs.count();
  if (visibleCount > 0) {
    // Desktop/tablet: last visible MM/DD/YYYY input is DOB
    const dobInput = visibleDateInputs.nth(visibleCount - 1);
    await dobInput.scrollIntoViewIfNeeded();
    await dobInput.fill('01/15/1990');
  } else {
    // Mobile: native date input — type date via keyboard (mm/dd/yyyy order in Chromium)
    const dobInput = page.locator('input[type="date"]:visible').last();
    await dobInput.scrollIntoViewIfNeeded();
    await dobInput.click();
    // Chromium native date input: type month, day, year with Tab between fields
    await page.keyboard.type('01');
    await page.keyboard.press('Tab');
    await page.keyboard.type('15');
    await page.keyboard.press('Tab');
    await page.keyboard.type('1990');
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}02-personal-info.png`, fullPage: false });

  // Step 3: Identification
  const idTypeSelect = page.locator('button[role="combobox"]').first();
  await idTypeSelect.click();
  await page.getByText("Driver's License", { exact: false }).click();
  await page.getByPlaceholder('Enter ID Number').fill('DL123456789');

  // Upload ID photo
  const idUploadArea = page.locator('text=Drag and drop file or').first().locator('..');
  const [idFileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    idUploadArea.click(),
  ]);
  await idFileChooser.setFiles('e2e/fixtures/test-id.png');
  await expect(page.locator('text=test-id.png').first()).toBeVisible({ timeout: 15_000 });

  // Scroll to identification section
  await page.locator('h2:has-text("Identification")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}03-identification.png`, fullPage: false });

  // Step 4: Residential History
  await page.getByPlaceholder('Enter Street Address').fill('123 Test St');
  await page.getByPlaceholder('Enter City').fill('Salt Lake City');
  await page.getByPlaceholder('Enter State').fill('Utah');
  await page.getByPlaceholder('Enter ZIP Code').fill('84101');
  const durationInput = page.locator('input[type="number"]').first();
  await durationInput.fill('24');
  const monthlyPaymentInput = page.locator('#monthlyPayment-0');
  await monthlyPaymentInput.scrollIntoViewIfNeeded();
  await monthlyPaymentInput.click();
  await monthlyPaymentInput.fill('1500');
  await page.locator('#own-0').scrollIntoViewIfNeeded();
  await page.locator('#own-0').click({ force: true });

  await page.locator('h2:has-text("Residential History")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}04-residential.png`, fullPage: false });

  // Step 5: Income + Questionnaire
  await page.getByPlaceholder('Enter your Income Source').fill('Software Engineering');
  await page.getByPlaceholder('Enter Monthly Amount').fill('8000');

  // Income proof upload
  const incomeUploadArea = page.locator('text=Drag and drop file or').first().locator('..');
  const [incomeFileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    incomeUploadArea.click(),
  ]);
  await incomeFileChooser.setFiles('e2e/fixtures/test-id.png');
  await expect(page.locator('h3:has-text("Income Proof 1")').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(3_000);

  const felonyNo = page.locator('#felony-no');
  await felonyNo.scrollIntoViewIfNeeded();
  await felonyNo.click();
  await page.locator('#evicted-no').click();

  await page.locator('h2:has-text("Income")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}05-income-questionnaire.png`, fullPage: false });

  // Step 6: Submit + Success
  await submitButton.click();
  await expect(page.getByText('Application Submitted!')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}06-success.png`, fullPage: false });
}

test.describe('Report: Application Submit Flow', () => {
  test('desktop flow', async ({ page, context }) => {
    test.setTimeout(120_000);
    await captureFlow(page, context, 'desktop-');
  });

  // Skip mobile: Chromium headless can't fill native date inputs (type="date") which render below md breakpoint
  test.skip('mobile flow', async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await captureFlow(page, context, 'mobile-');
    await context.close();
  });

  test('laptop screenshots', async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();
    await captureFlow(page, context, 'laptop-');
    await context.close();
  });

  test('tablet screenshots', async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await captureFlow(page, context, 'tablet-');
    await context.close();
  });
});

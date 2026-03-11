/**
 * Screenshot-capture spec for the "Booking Modifications — Host Approval & Rejection" report.
 * Run with: npx playwright test e2e/booking-modifications-screenshots.spec.ts
 *
 * Generates dark-mode screenshots into e2e/screenshots/ for documentation.
 * Uses Prisma fixtures to create pending modification requests, then captures
 * the host approving/rejecting them.
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  findActiveBookingForHost,
  getUserIdByEmail,
  createBookingModificationFixture,
  createPaymentModificationFixture,
  findRentPaymentForBooking,
  cleanupTestModifications,
  cleanupTestPaymentModifications,
} from './helpers/booking-modifications';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const SCREENSHOT_DIR = 'e2e/screenshots';
const NOTIFICATION_EMAIL = 'tyler.bennett52@gmail.com';

const TEST_HOST = {
  email: process.env.TEST_HOST_EMAIL!,
  password: process.env.TEST_HOST_PASSWORD!,
};

// Track created modifications for cleanup
const createdBookingModIds: string[] = [];
const createdPaymentModIds: string[] = [];

// Shared state
let bookingInfo: Awaited<ReturnType<typeof findActiveBookingForHost>>;
let notificationUserId: string | null;

/** Sign in as the permanent host test account. */
async function signInAsHost(page: import('@playwright/test').Page) {
  await setupClerkTestingToken({ page });
  await page.goto('/sign-in');
  await page.waitForSelector('form', { state: 'visible' });
  await page.fill('input[name="identifier"]', TEST_HOST.email);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForSelector('input[name="password"]', { state: 'visible' });
  await page.fill('input[name="password"]', TEST_HOST.password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 15_000 });
  await page.waitForSelector('[data-testid="user-menu-trigger"]', { timeout: 10_000 });
}

/** Shared flow: captures screenshots at each step. */
async function captureFlow(
  page: import('@playwright/test').Page,
  prefix: string,
) {
  // --- Setup: find booking and notification user ---
  bookingInfo = await findActiveBookingForHost(TEST_HOST.email);
  expect(bookingInfo).not.toBeNull();
  notificationUserId = await getUserIdByEmail(NOTIFICATION_EMAIL);
  expect(notificationUserId).not.toBeNull();

  // --- Date Change: Create fixture ---
  const newEndDate = new Date(bookingInfo!.endDate);
  newEndDate.setMonth(newEndDate.getMonth() + 1);
  const dateMod = await createBookingModificationFixture({
    bookingId: bookingInfo!.bookingId,
    requestorId: notificationUserId!,
    recipientId: bookingInfo!.hostId,
    originalStartDate: bookingInfo!.startDate,
    originalEndDate: bookingInfo!.endDate,
    newStartDate: bookingInfo!.startDate,
    newEndDate,
    reason: 'Screenshot report: extend lease by 1 month',
  });
  createdBookingModIds.push(dateMod.id);

  // --- Payment Change: Create fixture ---
  const rentPayment = await findRentPaymentForBooking(bookingInfo!.bookingId);
  let paymentModId: string | null = null;
  if (rentPayment) {
    const newAmount = Math.max(rentPayment.amount - 5000, 100);
    const newDueDate = new Date(rentPayment.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);
    const paymentMod = await createPaymentModificationFixture({
      rentPaymentId: rentPayment.id,
      requestorId: notificationUserId!,
      recipientId: bookingInfo!.hostId,
      originalAmount: rentPayment.amount,
      originalDueDate: rentPayment.dueDate,
      newAmount,
      newDueDate,
      reason: 'Screenshot report: reduce payment by $50 and delay 1 week',
    });
    createdPaymentModIds.push(paymentMod.id);
    paymentModId = paymentMod.id;
  }

  // --- Sign in and navigate ---
  await signInAsHost(page);
  await page.goto(
    `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
  );
  await page.waitForLoadState('domcontentloaded');

  // --- Screenshot 1: Pending requests overview ---
  await expect(page.getByText('Change Requests for this booking')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}01-pending-requests.png`, fullPage: false });

  // --- Screenshot 2: Expanded date change details ---
  const dateChangeCard = page.getByText('Move-in/Move-out Change').first();
  await expect(dateChangeCard).toBeVisible({ timeout: 10_000 });
  await dateChangeCard.click();
  await expect(page.getByText('New Move-out Date')).toBeVisible({ timeout: 5_000 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}02-date-change-details.png`, fullPage: false });

  // --- Screenshot 3: Date change approved ---
  const approveButton = page.getByRole('button', { name: 'Approve Change' }).first();
  await expect(approveButton).toBeVisible({ timeout: 5_000 });
  await approveButton.click();
  await expect(page.getByText('Processing...').first()).toBeHidden({ timeout: 60_000 });
  await expect(page.getByText('Approved').first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}03-date-change-approved.png`, fullPage: false });

  // --- Payment modification screenshots (if payment exists) ---
  if (paymentModId) {
    // Refresh the page to get fresh state
    await page.goto(
      `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
    );
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 15_000 });

    // --- Screenshot 4: Expanded payment change details ---
    const paymentCard = page.getByText('Payment Change').first();
    await expect(paymentCard).toBeVisible({ timeout: 10_000 });
    await paymentCard.click();
    await expect(page.getByText('New Amount')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}04-payment-change-details.png`, fullPage: false });

    // --- Screenshot 5: Payment change declined ---
    const declineButton = page.getByRole('button', { name: 'Decline Change' }).first();
    await expect(declineButton).toBeVisible({ timeout: 5_000 });
    await declineButton.click();
    await expect(page.getByText('Processing...').first()).toBeHidden({ timeout: 60_000 });
    await expect(page.getByText('Rejected').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}05-payment-change-rejected.png`, fullPage: false });
  }
}

test.describe('Report Screenshots: Booking Modifications', () => {
  // Serial: both flows share the same booking/fixtures
  test.describe.configure({ mode: 'serial' });
  // Dark color scheme for dark-mode screenshots
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async () => {
    test.skip(
      !TEST_HOST.email || !TEST_HOST.password,
      'Host test account not configured in e2e/.env.test'
    );
  });

  test.afterAll(async () => {
    if (createdBookingModIds.length > 0) {
      await cleanupTestModifications(createdBookingModIds);
    }
    if (createdPaymentModIds.length > 0) {
      await cleanupTestPaymentModifications(createdPaymentModIds);
    }
  });

  test('desktop flow', async ({ page }) => {
    test.setTimeout(180_000);
    await captureFlow(page, 'desktop-mod-');
  });

  test('mobile flow', async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    await captureFlow(page, 'mobile-mod-');
    await context.close();
  });
});

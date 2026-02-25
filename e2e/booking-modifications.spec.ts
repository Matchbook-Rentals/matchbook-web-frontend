/**
 * Booking Modifications E2E Tests
 *
 * Tests the host-side approval and rejection of booking modification requests
 * (date changes and payment changes).
 *
 * FIXTURE APPROACH:
 * Modifications are created directly via Prisma as a fixture, with
 * tyler.bennett52@gmail.com as the requestor so real notification emails
 * are sent on approval/rejection. The TEST_HOST signs in and approves/rejects.
 *
 * TODO: Eventually replace the Prisma fixture with actual renter e2e user
 * interactions to create the modification requests through the UI.
 *
 * Requires:
 *   - TEST_HOST_EMAIL / TEST_HOST_PASSWORD in e2e/.env.test
 *   - The TEST_HOST must have at least one active booking on their listings
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
  getBookingModificationStatus,
  getPaymentModificationStatus,
  cleanupTestModifications,
  cleanupTestPaymentModifications,
} from './helpers/booking-modifications';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// The renter email used as the requestor so notification emails arrive.
// TODO: Eventually this will be the actual renter e2e user who creates
// modification requests through the UI.
const NOTIFICATION_EMAIL = 'tyler.bennett52@gmail.com';

const TEST_HOST = {
  email: process.env.TEST_HOST_EMAIL!,
  password: process.env.TEST_HOST_PASSWORD!,
};

// Track created modifications for cleanup
const createdBookingModIds: string[] = [];
const createdPaymentModIds: string[] = [];

// Shared state across serial tests
let bookingInfo: Awaited<ReturnType<typeof findActiveBookingForHost>>;
let notificationUserId: string | null;

/** Attach a named screenshot to the test report. */
async function screenshot(page: import('@playwright/test').Page, name: string) {
  const buffer = await page.screenshot({ fullPage: true });
  await test.info().attach(name, { body: buffer, contentType: 'image/png' });
}

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

test.describe('Booking Modifications — Host Approval & Rejection', () => {
  test.describe.configure({ mode: 'serial' });

  // Use dark color scheme so all screenshots render in dark mode
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async () => {
    test.skip(
      !TEST_HOST.email || !TEST_HOST.password,
      'Host test account not configured in e2e/.env.test'
    );
  });

  test.afterAll(async () => {
    // Clean up any test modifications we created
    if (createdBookingModIds.length > 0) {
      await cleanupTestModifications(createdBookingModIds);
    }
    if (createdPaymentModIds.length > 0) {
      await cleanupTestPaymentModifications(createdPaymentModIds);
    }
  });

  // ---------------------------------------------------------------------------
  // Setup: find an active booking and resolve the notification user
  // ---------------------------------------------------------------------------
  test('find active booking for host and resolve notification user', async () => {
    test.setTimeout(30_000);

    bookingInfo = await findActiveBookingForHost(TEST_HOST.email);
    expect(bookingInfo, `No active booking found on listings hosted by ${TEST_HOST.email}`).not.toBeNull();

    notificationUserId = await getUserIdByEmail(NOTIFICATION_EMAIL);
    expect(notificationUserId, `User not found for ${NOTIFICATION_EMAIL}`).not.toBeNull();

    console.log(`Found booking ${bookingInfo!.bookingId} for listing "${bookingInfo!.listingTitle}"`);
    console.log(`  Host (recipient):    ${bookingInfo!.hostId}`);
    console.log(`  Notification user:   ${notificationUserId} (${NOTIFICATION_EMAIL})`);
    console.log(`  Dates: ${bookingInfo!.startDate.toISOString()} → ${bookingInfo!.endDate.toISOString()}`);
  });

  // ---------------------------------------------------------------------------
  // Date Change — Approval
  // ---------------------------------------------------------------------------
  test('host can approve a booking date change request', async ({ page }) => {
    test.setTimeout(90_000);
    expect(bookingInfo).not.toBeNull();
    expect(notificationUserId).not.toBeNull();

    // Create a date change fixture: shift end date 1 month later
    const newEndDate = new Date(bookingInfo!.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    // TODO: Replace this fixture with actual renter e2e user creating the
    // modification through the UI once that flow is fully testable.
    const dateMod = await createBookingModificationFixture({
      bookingId: bookingInfo!.bookingId,
      requestorId: notificationUserId!,
      recipientId: bookingInfo!.hostId,
      originalStartDate: bookingInfo!.startDate,
      originalEndDate: bookingInfo!.endDate,
      newStartDate: bookingInfo!.startDate,
      newEndDate,
      reason: 'E2E test: extend lease by 1 month (approval test)',
    });
    createdBookingModIds.push(dateMod.id);

    // Sign in as host and navigate to the changes page
    await signInAsHost(page);
    await page.goto(
      `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
    );
    await page.waitForLoadState('domcontentloaded');

    // Wait for modifications to load
    await expect(page.getByText('Change Requests for this booking')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '1-date-approve-pending-requests');

    // Expand the date change modification
    const dateChangeCard = page.getByText('Move-in/Move-out Change').first();
    await expect(dateChangeCard).toBeVisible({ timeout: 10_000 });
    await dateChangeCard.click();

    // Should see the new dates displayed
    await expect(page.getByText('New Move-out Date')).toBeVisible({ timeout: 5_000 });
    await screenshot(page, '2-date-approve-expanded-details');

    // Click Approve
    const approveButton = page.getByRole('button', { name: 'Approve Change' }).first();
    await expect(approveButton).toBeVisible({ timeout: 5_000 });
    await approveButton.click();

    // Wait for the action to complete — the card should move to "Previous Requests"
    // or show an "Approved" badge
    await expect(
      page.getByText('Approved').first()
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '3-date-approve-result');

    // Verify in database
    const status = await getBookingModificationStatus(dateMod.id);
    expect(status).toBe('approved');
  });

  // ---------------------------------------------------------------------------
  // Date Change — Rejection
  // ---------------------------------------------------------------------------
  test('host can reject a booking date change request', async ({ page }) => {
    test.setTimeout(90_000);
    expect(bookingInfo).not.toBeNull();
    expect(notificationUserId).not.toBeNull();

    // Create another date change fixture: shift start date 2 weeks earlier
    const newStartDate = new Date(bookingInfo!.startDate);
    newStartDate.setDate(newStartDate.getDate() - 14);

    // TODO: Replace this fixture with actual renter e2e user creating the
    // modification through the UI once that flow is fully testable.
    const dateMod = await createBookingModificationFixture({
      bookingId: bookingInfo!.bookingId,
      requestorId: notificationUserId!,
      recipientId: bookingInfo!.hostId,
      originalStartDate: bookingInfo!.startDate,
      originalEndDate: bookingInfo!.endDate,
      newStartDate,
      newEndDate: bookingInfo!.endDate,
      reason: 'E2E test: move in 2 weeks earlier (rejection test)',
    });
    createdBookingModIds.push(dateMod.id);

    // Sign in as host and navigate to changes page
    await signInAsHost(page);
    await page.goto(
      `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
    );
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Change Requests for this booking')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '1-date-reject-pending-requests');

    // Find and expand the pending date change modification
    const dateChangeCard = page.locator('text=Move-in/Move-out Change').first();
    await dateChangeCard.click();

    // Should see the date fields
    await expect(page.getByText('New Move-in Date')).toBeVisible({ timeout: 5_000 });
    await screenshot(page, '2-date-reject-expanded-details');

    // Click Decline
    const declineButton = page.getByRole('button', { name: 'Decline Change' }).first();
    await expect(declineButton).toBeVisible({ timeout: 5_000 });
    await declineButton.click();

    // Wait for the action to complete — should show "Rejected" badge
    await expect(
      page.getByText('Rejected').first()
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '3-date-reject-result');

    // Verify in database
    const status = await getBookingModificationStatus(dateMod.id);
    expect(status).toBe('rejected');
  });

  // ---------------------------------------------------------------------------
  // Payment Change — Approval
  // ---------------------------------------------------------------------------
  test('host can approve a payment modification request', async ({ page }) => {
    test.setTimeout(90_000);
    expect(bookingInfo).not.toBeNull();
    expect(notificationUserId).not.toBeNull();

    // Find a rent payment to modify
    const rentPayment = await findRentPaymentForBooking(bookingInfo!.bookingId);
    test.skip(!rentPayment, 'No unpaid rent payment found for this booking');

    // Create a payment modification fixture: reduce amount by $50
    const newAmount = Math.max(rentPayment!.amount - 5000, 100); // subtract $50 (in cents), min $1
    const newDueDate = new Date(rentPayment!.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7); // push due date 1 week later

    // TODO: Replace this fixture with actual renter e2e user creating the
    // payment modification through the UI once that flow is fully testable.
    const paymentMod = await createPaymentModificationFixture({
      rentPaymentId: rentPayment!.id,
      requestorId: notificationUserId!,
      recipientId: bookingInfo!.hostId,
      originalAmount: rentPayment!.amount,
      originalDueDate: rentPayment!.dueDate,
      newAmount,
      newDueDate,
      reason: 'E2E test: reduce payment by $50 and delay 1 week (approval test)',
    });
    createdPaymentModIds.push(paymentMod.id);

    // Sign in as host and navigate to changes page
    await signInAsHost(page);
    await page.goto(
      `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
    );
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Change Requests for this booking')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '1-payment-approve-pending-requests');

    // Expand the payment change modification
    const paymentChangeCard = page.getByText('Payment Change').first();
    await expect(paymentChangeCard).toBeVisible({ timeout: 10_000 });
    await paymentChangeCard.click();

    // Should see payment fields
    await expect(page.getByText('New Amount')).toBeVisible({ timeout: 5_000 });
    await screenshot(page, '2-payment-approve-expanded-details');

    // Click Approve
    const approveButton = page.getByRole('button', { name: 'Approve Change' }).first();
    await expect(approveButton).toBeVisible({ timeout: 5_000 });
    await approveButton.click();

    // Wait for the action to complete — the server action sends a notification email
    // which can take up to ~30s. Wait for "Processing..." to disappear first.
    await expect(
      page.getByText('Processing...').first()
    ).toBeHidden({ timeout: 60_000 });

    // Now check for the "Approved" badge
    await expect(
      page.getByText('Approved').first()
    ).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '3-payment-approve-result');

    // Verify in database
    const status = await getPaymentModificationStatus(paymentMod.id);
    expect(status).toBe('approved');
  });

  // ---------------------------------------------------------------------------
  // Payment Change — Rejection
  // ---------------------------------------------------------------------------
  test('host can reject a payment modification request', async ({ page }) => {
    test.setTimeout(90_000);
    expect(bookingInfo).not.toBeNull();
    expect(notificationUserId).not.toBeNull();

    // Find a rent payment to modify
    const rentPayment = await findRentPaymentForBooking(bookingInfo!.bookingId);
    test.skip(!rentPayment, 'No unpaid rent payment found for this booking');

    // Create a payment modification fixture: increase amount by $100
    const newAmount = rentPayment!.amount + 10000; // add $100 (in cents)
    const newDueDate = new Date(rentPayment!.dueDate);
    newDueDate.setDate(newDueDate.getDate() - 3); // move due date 3 days earlier

    // TODO: Replace this fixture with actual renter e2e user creating the
    // payment modification through the UI once that flow is fully testable.
    const paymentMod = await createPaymentModificationFixture({
      rentPaymentId: rentPayment!.id,
      requestorId: notificationUserId!,
      recipientId: bookingInfo!.hostId,
      originalAmount: rentPayment!.amount,
      originalDueDate: rentPayment!.dueDate,
      newAmount,
      newDueDate,
      reason: 'E2E test: increase payment by $100, earlier due date (rejection test)',
    });
    createdPaymentModIds.push(paymentMod.id);

    // Sign in as host and navigate to changes page
    await signInAsHost(page);
    await page.goto(
      `/app/host/${bookingInfo!.listingId}/bookings/${bookingInfo!.bookingId}/changes`
    );
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Change Requests for this booking')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Pending Requests/)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '1-payment-reject-pending-requests');

    // Expand the payment change modification
    const paymentChangeCard = page.getByText('Payment Change').first();
    await expect(paymentChangeCard).toBeVisible({ timeout: 10_000 });
    await paymentChangeCard.click();

    // Should see payment fields
    await expect(page.getByText('New Due Date')).toBeVisible({ timeout: 5_000 });
    await screenshot(page, '2-payment-reject-expanded-details');

    // Click Decline
    const declineButton = page.getByRole('button', { name: 'Decline Change' }).first();
    await expect(declineButton).toBeVisible({ timeout: 5_000 });
    await declineButton.click();

    // Wait for the action to complete — the server action sends a notification email
    // which can take up to ~30s. Wait for "Processing..." to disappear first.
    await expect(
      page.getByText('Processing...').first()
    ).toBeHidden({ timeout: 60_000 });

    // Now check for the "Rejected" badge
    await expect(
      page.getByText('Rejected').first()
    ).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '3-payment-reject-result');

    // Verify in database
    const status = await getPaymentModificationStatus(paymentMod.id);
    expect(status).toBe('rejected');
  });
});

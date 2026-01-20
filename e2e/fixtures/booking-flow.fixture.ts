/**
 * Booking Flow Test Fixtures
 *
 * Supports two modes:
 * 1. Permanent test users (default) - Uses TEST_HOST_EMAIL/TEST_RENTER_EMAIL from env
 * 2. Dynamic test users - Creates new accounts using Clerk's test email format
 *
 * To use permanent users, set these in e2e/.env.test:
 *   TEST_HOST_EMAIL, TEST_HOST_PASSWORD
 *   TEST_RENTER_EMAIL, TEST_RENTER_PASSWORD
 *
 * For dynamic users (signup testing), use generateTestAccounts()
 *
 * See: https://clerk.com/docs/testing/test-emails-and-phones
 */

import { test as base, Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load e2e test environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

// Test account credentials
export interface TestAccounts {
  host: {
    email: string;
    password: string;
    userId?: string;
  };
  renter: {
    email: string;
    password: string;
    userId?: string;
  };
}

/**
 * Get permanent test accounts from environment variables.
 * These accounts should be created once in Clerk and reused for all tests.
 */
export function getPermanentTestAccounts(): TestAccounts {
  const hostEmail = process.env.TEST_HOST_EMAIL;
  const hostPassword = process.env.TEST_HOST_PASSWORD;
  const renterEmail = process.env.TEST_RENTER_EMAIL;
  const renterPassword = process.env.TEST_RENTER_PASSWORD;

  if (!hostEmail || !hostPassword || !renterEmail || !renterPassword) {
    throw new Error(
      'Missing test account credentials. Please set TEST_HOST_EMAIL, TEST_HOST_PASSWORD, ' +
      'TEST_RENTER_EMAIL, and TEST_RENTER_PASSWORD in e2e/.env.test\n' +
      'See e2e/.env.test.example for the expected format.'
    );
  }

  return {
    host: {
      email: hostEmail,
      password: hostPassword,
    },
    renter: {
      email: renterEmail,
      password: renterPassword,
    },
  };
}

/**
 * Check if permanent test accounts are configured
 */
export function hasPermanentTestAccounts(): boolean {
  return !!(
    process.env.TEST_HOST_EMAIL &&
    process.env.TEST_HOST_PASSWORD &&
    process.env.TEST_RENTER_EMAIL &&
    process.env.TEST_RENTER_PASSWORD
  );
}

/**
 * Generate unique test emails using Clerk's test format.
 * Use this only for testing the actual signup flow.
 * These accounts can be verified with code 424242.
 */
export function generateTestAccounts(): TestAccounts {
  const timestamp = Date.now();
  return {
    host: {
      email: `testhost+clerk_test_${timestamp}@example.com`,
      password: 'TestHost$2026!SecurePass',
    },
    renter: {
      email: `testrenter+clerk_test_${timestamp + 1}@example.com`,
      password: 'TestRenter$2026!SecurePass',
    },
  };
}

/**
 * Get test accounts - prefers permanent accounts if configured,
 * falls back to generating new ones (with a warning)
 */
export function getTestAccounts(): TestAccounts {
  if (hasPermanentTestAccounts()) {
    console.log('Using permanent test accounts from environment variables');
    return getPermanentTestAccounts();
  }

  console.warn(
    '⚠️  No permanent test accounts configured. Generating new accounts.\n' +
    '   This will create new users in Clerk on each test run.\n' +
    '   To use permanent accounts, set TEST_HOST_EMAIL, TEST_HOST_PASSWORD,\n' +
    '   TEST_RENTER_EMAIL, TEST_RENTER_PASSWORD in e2e/.env.test'
  );
  return generateTestAccounts();
}

/**
 * Complete Clerk signup flow with email verification.
 * Uses Clerk's test email format (+clerk_test) which can be verified with code 424242.
 */
export async function createTestAccount(
  page: Page,
  email: string,
  password: string,
  firstName: string = 'Test',
  lastName: string = 'User'
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Enable Clerk testing mode
    await setupClerkTestingToken({ page });

    // Navigate to sign-up page
    await page.goto('/sign-up');
    await page.waitForSelector('form', { state: 'visible', timeout: 15000 });

    // Fill the signup form
    // First name
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstNameInput.fill(firstName);
    }

    // Last name
    const lastNameInput = page.locator('input[name="lastName"]');
    if (await lastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lastNameInput.fill(lastName);
    }

    // Email
    await page.fill('input[name="emailAddress"]', email);

    // Password
    await page.fill('input[name="password"]', password);

    // Check terms checkbox if present
    const termsCheckbox = page.locator('input[name="terms"], [data-testid="terms-checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    } else {
      // Try clicking the label
      const termsLabel = page.getByText('I agree to the', { exact: false });
      if (await termsLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        await termsLabel.click();
      }
    }

    // Submit the form
    await page.getByRole('button', { name: /continue|sign up|create account/i }).click();

    // Wait for email verification screen
    await page.waitForSelector('text=/verify|verification|code/i', { timeout: 30000 });

    // Enter the test verification code (424242 for +clerk_test emails)
    // Clerk's OTP input might be individual inputs or a single field
    const otpContainer = page.locator('[data-otp-input-root]').first();
    if (await otpContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await otpContainer.click();
    } else {
      // Try focusing the first input
      const firstInput = page.locator('input[inputmode="numeric"], input[type="text"]').first();
      if (await firstInput.isVisible()) {
        await firstInput.click();
      }
    }

    // Type the verification code - Clerk auto-submits when all digits entered
    await page.keyboard.type('424242', { delay: 100 });

    // Wait for redirect (successful verification)
    await page.waitForURL((url) => !url.pathname.includes('/sign-up'), { timeout: 20000 });

    // Try to get the user ID from the page or cookies
    let userId: string | undefined;
    try {
      // Check if we can extract from Clerk's session
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('__session'));
      if (sessionCookie) {
        // User is signed in, we can try to get their ID
        // Navigate to a page that might expose the user ID
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    } catch {
      // User ID extraction is optional
    }

    return { success: true, userId };
  } catch (error) {
    console.error('Account creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during signup',
    };
  }
}

/**
 * Sign in to an existing test account
 */
export async function signInTestAccount(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  try {
    await setupClerkTestingToken({ page });

    await page.goto('/sign-in');
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });

    // Fill email
    await page.fill('input[name="identifier"]', email);
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for password field
    await page.waitForSelector('input[name="password"]', { state: 'visible', timeout: 10000 });

    // Fill password
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: /continue|sign in/i }).click();

    // Wait for navigation away from sign-in
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 15000 });

    return true;
  } catch (error) {
    console.error('Sign in failed:', error);
    return false;
  }
}

/**
 * Sign out the current user
 */
export async function signOutTestAccount(page: Page): Promise<void> {
  try {
    // Try clicking user menu and sign out
    const userMenuTrigger = page.getByTestId('user-menu-trigger');
    if (await userMenuTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userMenuTrigger.click();
      const signOutButton = page.getByTestId('sign-out-button');
      if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await signOutButton.click();
        await page.waitForURL((url) =>
          url.pathname === '/' || url.pathname.includes('/sign-in'),
          { timeout: 10000 }
        );
      }
    }
  } catch {
    // If sign out fails, navigate to home
    await page.goto('/');
  }
}

// Extended test type with fixtures
type BookingFlowFixtures = {
  testAccounts: TestAccounts;
  hostPage: Page;
  renterPage: Page;
};

/**
 * Extended Playwright test with booking flow fixtures
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/booking-flow.fixture';
 *
 * test('my test', async ({ testAccounts, hostPage, renterPage }) => {
 *   // testAccounts has pre-generated credentials
 *   // hostPage and renterPage are separate browser contexts
 * });
 * ```
 */
export const test = base.extend<BookingFlowFixtures>({
  // Generate test accounts for this test run
  testAccounts: async ({}, use) => {
    const accounts = generateTestAccounts();
    await use(accounts);
  },

  // Page for host actions (separate browser context)
  hostPage: async ({ browser, testAccounts }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set up Clerk testing token
    await setupClerkTestingToken({ page });

    await use(page);

    // Cleanup
    await context.close();
  },

  // Page for renter actions (separate browser context)
  renterPage: async ({ browser, testAccounts }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set up Clerk testing token
    await setupClerkTestingToken({ page });

    await use(page);

    // Cleanup
    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * One-time setup: Create both test accounts
 * Run this once before the test suite
 */
export async function setupTestAccounts(
  page: Page,
  accounts: TestAccounts
): Promise<{ host: boolean; renter: boolean }> {
  const results = { host: false, renter: false };

  // Create host account
  console.log('Creating host test account...');
  const hostResult = await createTestAccount(
    page,
    accounts.host.email,
    accounts.host.password,
    'Test',
    'Host'
  );
  results.host = hostResult.success;
  if (hostResult.success) {
    accounts.host.userId = hostResult.userId;
    console.log('✓ Host account created:', accounts.host.email);
  } else {
    console.error('✗ Host account creation failed:', hostResult.error);
  }

  // Sign out before creating next account
  await signOutTestAccount(page);
  await page.waitForTimeout(1000);

  // Create renter account
  console.log('Creating renter test account...');
  const renterResult = await createTestAccount(
    page,
    accounts.renter.email,
    accounts.renter.password,
    'Test',
    'Renter'
  );
  results.renter = renterResult.success;
  if (renterResult.success) {
    accounts.renter.userId = renterResult.userId;
    console.log('✓ Renter account created:', accounts.renter.email);
  } else {
    console.error('✗ Renter account creation failed:', renterResult.error);
  }

  // Sign out
  await signOutTestAccount(page);

  return results;
}

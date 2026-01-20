/**
 * One-time setup script to create permanent test accounts in Clerk.
 * Run this ONCE with: npx playwright test setup-permanent-accounts.spec.ts
 *
 * After running, the accounts will exist in Clerk and can be reused for all future tests.
 */

import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { createTestAccount, signInTestAccount, signOutTestAccount } from './fixtures/booking-flow.fixture';

// Permanent test account credentials - these match e2e/.env.test
// Note: +clerk_test in email allows verification with code 424242
const PERMANENT_ACCOUNTS = {
  host: {
    email: 'e2e-testhost+clerk_test@matchbookrentals.com',
    password: 'TestHost$2026!SecurePass',
    firstName: 'Test',
    lastName: 'Host',
  },
  renter: {
    email: 'e2e-testrenter+clerk_test@matchbookrentals.com',
    password: 'TestRenter$2026!SecurePass',
    firstName: 'Test',
    lastName: 'Renter',
  },
};

test.describe('Create Permanent Test Accounts', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000); // 60 second timeout

  test('Verify or create HOST account', async ({ page }) => {
    await setupClerkTestingToken({ page });

    // First try to sign in - if it works, account already exists
    console.log(`Checking if host account exists: ${PERMANENT_ACCOUNTS.host.email}`);

    const signedIn = await signInTestAccount(
      page,
      PERMANENT_ACCOUNTS.host.email,
      PERMANENT_ACCOUNTS.host.password
    );

    if (signedIn) {
      console.log('✓ HOST account already exists and sign-in works!');
      await signOutTestAccount(page);
      return;
    }

    // Account doesn't exist, create it
    console.log(`Creating host account: ${PERMANENT_ACCOUNTS.host.email}`);

    const result = await createTestAccount(
      page,
      PERMANENT_ACCOUNTS.host.email,
      PERMANENT_ACCOUNTS.host.password,
      PERMANENT_ACCOUNTS.host.firstName,
      PERMANENT_ACCOUNTS.host.lastName
    );

    expect(result.success).toBe(true);
    console.log('✓ Permanent HOST account created successfully!');
  });

  test('Verify or create RENTER account', async ({ page }) => {
    await setupClerkTestingToken({ page });

    // First try to sign in - if it works, account already exists
    console.log(`Checking if renter account exists: ${PERMANENT_ACCOUNTS.renter.email}`);

    const signedIn = await signInTestAccount(
      page,
      PERMANENT_ACCOUNTS.renter.email,
      PERMANENT_ACCOUNTS.renter.password
    );

    if (signedIn) {
      console.log('✓ RENTER account already exists and sign-in works!');
      await signOutTestAccount(page);
      return;
    }

    // Account doesn't exist, create it
    console.log(`Creating renter account: ${PERMANENT_ACCOUNTS.renter.email}`);

    const result = await createTestAccount(
      page,
      PERMANENT_ACCOUNTS.renter.email,
      PERMANENT_ACCOUNTS.renter.password,
      PERMANENT_ACCOUNTS.renter.firstName,
      PERMANENT_ACCOUNTS.renter.lastName
    );

    expect(result.success).toBe(true);
    console.log('✓ Permanent RENTER account created successfully!');
  });
});

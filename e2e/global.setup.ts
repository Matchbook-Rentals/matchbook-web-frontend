import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import { createTestUser, cleanupStaleTestUsers } from './helpers/test-user';

// Run setup serially to ensure Clerk token is obtained before tests
setup.describe.configure({ mode: 'serial' });

setup('global setup', async ({}) => {
  // Setup Clerk testing environment
  await clerkSetup();

  // Cleanup any stale test users from previous runs
  await cleanupStaleTestUsers();

  // Create a fresh test user for this test run
  await createTestUser('e2e-verification');
});

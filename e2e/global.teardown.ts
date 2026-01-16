import { test as teardown } from '@playwright/test';
import { cleanupAllTestUsers } from './helpers/test-user';

teardown('global teardown', async ({}) => {
  // Cleanup all test users created during this test run
  await cleanupAllTestUsers();
});

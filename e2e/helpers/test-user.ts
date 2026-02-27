// Test user management - create and cleanup Clerk users for e2e tests
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// Ephemeral test users are created with this prefix — only these should ever be deleted
const EPHEMERAL_EMAIL_PREFIX = 'e2e-verification+';

// Permanent test accounts that must NEVER be deleted
const PROTECTED_EMAILS = [
  process.env.TEST_USER_EMAIL,
  process.env.TEST_ADMIN_EMAIL,
  process.env.TEST_HOST_EMAIL,
  process.env.TEST_RENTER_EMAIL,
].filter(Boolean) as string[];

const isEphemeralTestUser = (email: string): boolean => {
  return email.startsWith(EPHEMERAL_EMAIL_PREFIX) && email.endsWith('@matchbookrentals.com');
};

const isProtectedUser = (email: string): boolean => {
  return PROTECTED_EMAILS.includes(email);
};

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

import * as fs from 'fs';
import * as path from 'path';

// File to persist user data across processes
const TEMP_USER_FILE = path.join(process.cwd(), '.e2e-test-users.json');

interface StoredData {
  userIds: string[];
  credentials?: {
    id: string;
    email: string;
    password: string;
  };
}

// Get stored data from file (shared across processes)
function getStoredData(): StoredData {
  try {
    if (fs.existsSync(TEMP_USER_FILE)) {
      return JSON.parse(fs.readFileSync(TEMP_USER_FILE, 'utf-8'));
    }
  } catch {
    // Ignore errors
  }
  return { userIds: [] };
}

// Save data to file
function saveStoredData(data: StoredData): void {
  fs.writeFileSync(TEMP_USER_FILE, JSON.stringify(data));
}

// Get created users from file
function getCreatedUsers(): string[] {
  return getStoredData().userIds;
}

// Save created user ID
function saveCreatedUserId(userId: string): void {
  const data = getStoredData();
  data.userIds.push(userId);
  saveStoredData(data);
}

// Save test user credentials for other workers
function saveTestUserCredentials(creds: TestUser): void {
  const data = getStoredData();
  data.credentials = creds;
  saveStoredData(data);
}

// Clean up temp file
function cleanupTempFile(): void {
  try {
    if (fs.existsSync(TEMP_USER_FILE)) {
      fs.unlinkSync(TEMP_USER_FILE);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Create a test user in Clerk without MFA
 */
export async function createTestUser(
  emailPrefix: string = 'e2e-test'
): Promise<TestUser> {
  const timestamp = Date.now();
  // Use a real-looking email format that Clerk will accept
  const email = `${emailPrefix}+${timestamp}@matchbookrentals.com`;
  const password = `TestPass123!${timestamp}`;

  console.log(`Creating test user: ${email}`);

  try {
    const user = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName: 'E2E',
      lastName: 'TestUser',
      skipPasswordChecks: true,
      // Required when legal_consent_enabled is true in Clerk settings
      legalAcceptedAt: new Date(),
      // Set admin role for access to protected routes like verification
      publicMetadata: {
        role: 'admin_dev',
      },
    });

    // Track for cleanup (persist to file for cross-process sharing)
    saveCreatedUserId(user.id);

    const credentials: TestUser = {
      id: user.id,
      email,
      password,
    };

    // Save credentials to file for other workers to read
    saveTestUserCredentials(credentials);

    // Also store in environment for current process
    process.env.E2E_TEST_USER_ID = user.id;
    process.env.E2E_TEST_USER_EMAIL = email;
    process.env.E2E_TEST_USER_PASSWORD = password;

    console.log(`Test user created: ${user.id}`);

    return credentials;
  } catch (error: any) {
    console.error('Failed to create test user:', error.message);
    console.error('Error details:', JSON.stringify(error.errors || error, null, 2));
    throw error;
  }
}

/**
 * Delete a specific test user. Refuses to delete protected permanent accounts.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  try {
    // Fetch user first to verify it's ephemeral
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress ?? '';

    if (isProtectedUser(email)) {
      console.warn(`REFUSED to delete protected account: ${email} (${userId})`);
      return;
    }

    if (!isEphemeralTestUser(email)) {
      console.warn(`REFUSED to delete non-ephemeral user: ${email} (${userId})`);
      return;
    }

    console.log(`Deleting test user: ${userId} (${email})`);
    await clerk.users.deleteUser(userId);
    console.log(`Test user deleted: ${userId}`);
  } catch (error: any) {
    // Ignore "user not found" errors (already deleted)
    if (error.status !== 404) {
      console.error(`Failed to delete user ${userId}:`, error.message);
    }
  }
}

/**
 * Cleanup all test users created during this test run
 */
export async function cleanupAllTestUsers(): Promise<void> {
  const createdUsers = getCreatedUsers();
  console.log(`Cleaning up ${createdUsers.length} test users...`);

  for (const userId of createdUsers) {
    await deleteTestUser(userId);
  }

  // Clean up the temp file
  cleanupTempFile();
}

/**
 * Cleanup old ephemeral test users (older than 1 hour) that may have been left behind
 * by crashed test runs. Only deletes users matching the ephemeral email pattern.
 */
export async function cleanupStaleTestUsers(): Promise<void> {
  console.log('Cleaning up stale test users...');

  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    // Query matches the actual ephemeral email pattern: e2e-verification+*@matchbookrentals.com
    const users = await clerk.users.getUserList({
      emailAddress: ['e2e-verification+%@matchbookrentals.com'],
      limit: 100,
    });

    // Rate limit: only clean up 2 per run to avoid hammering the Clerk API
    const MAX_CLEANUP_PER_RUN = 2;
    let deletedCount = 0;

    for (const user of users.data) {
      if (deletedCount >= MAX_CLEANUP_PER_RUN) break;

      const email = user.emailAddresses[0]?.emailAddress ?? '';
      const isOld = user.createdAt < oneHourAgo;

      if (isEphemeralTestUser(email) && !isProtectedUser(email) && isOld) {
        await deleteTestUser(user.id);
        deletedCount++;
      }
    }

    const remaining = users.data.length - deletedCount;
    console.log(`Cleaned up ${deletedCount} stale test users${remaining > 0 ? ` (${remaining} remaining, will clean next run)` : ''}`);
  } catch (error: any) {
    console.error('Failed to cleanup stale users:', error.message);
  }
}

/**
 * Get the current test user credentials from file (shared across processes)
 */
export function getTestUserCredentials(): TestUser | null {
  // First try file (works across processes)
  const stored = getStoredData();
  if (stored.credentials) {
    return stored.credentials;
  }

  // Fallback to environment (same process)
  const id = process.env.E2E_TEST_USER_ID;
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!id || !email || !password) {
    return null;
  }

  return { id, email, password };
}

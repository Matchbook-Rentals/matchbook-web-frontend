// Test user management - create and cleanup Clerk users for e2e tests
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

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
 * Delete a specific test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  try {
    console.log(`Deleting test user: ${userId}`);
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
 * Cleanup old test users (older than 1 hour) that may have been left behind
 */
export async function cleanupStaleTestUsers(): Promise<void> {
  console.log('Cleaning up stale test users...');

  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    // Get all users with test email pattern
    const users = await clerk.users.getUserList({
      emailAddress: ['%@test.matchbookrentals.com'],
      limit: 100,
    });

    let deletedCount = 0;
    for (const user of users.data) {
      // Check if it's a test user and older than 1 hour
      const isTestUser = user.emailAddresses.some(
        e => e.emailAddress.includes('@test.matchbookrentals.com')
      );
      const isOld = user.createdAt < oneHourAgo;

      if (isTestUser && isOld) {
        await deleteTestUser(user.id);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} stale test users`);
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

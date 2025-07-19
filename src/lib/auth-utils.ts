import { auth } from '@clerk/nextjs/server';

/**
 * Shared authentication check utility that skips auth in test environment
 * @returns userId string
 * @throws Error if user not authenticated (in non-test environment)
 */
export const checkAuth = async (): Promise<string> => {
  // Skip auth check in test environment
  if (process.env.NODE_ENV === 'test') {
    return 'test-user-integration-123';
  }
  
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};
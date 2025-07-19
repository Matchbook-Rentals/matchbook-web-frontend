import { auth } from '@clerk/nextjs/server';

/**
 * Shared authentication check utility that skips auth in test environment
 * @returns userId string
 * @throws Error if user not authenticated (in non-test environment)
 */
export const checkAuth = async (): Promise<string> => {
  // Skip auth check in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 [checkAuth] Skipping auth check in test environment');
    return 'test-user-integration-123';
  }
  
  console.log('🔐 [checkAuth] Performing real auth check');
  let { userId } = auth();
  
  // If no userId on first try, wait 200ms and retry (Clerk can be slow)
  if (!userId) {
    console.log('🔐 [checkAuth] No userId on first attempt, retrying after 200ms delay');
    await new Promise(resolve => setTimeout(resolve, 200));
    ({ userId } = auth());
  }
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};
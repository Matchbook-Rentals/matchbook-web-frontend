import { auth, currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

/**
 * Shared authentication check utility that skips auth in test environment
 * Also ensures database user record exists (creates if missing via webhook fallback)
 * @returns userId string
 * @throws Error if user not authenticated (in non-test environment)
 */
export const checkAuth = async (): Promise<string> => {
  // Skip auth check in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 [checkAuth] Skipping auth check in test environment');
    return 'test-user-integration-123';
  }

  let { userId } = auth();

  // If no userId on first try, wait 200ms and retry (Clerk can be slow)
  if (!userId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    ({ userId } = auth());
  }

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check if user exists in database (webhook fallback)
  const dbUser = await prismadb.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  // If user doesn't exist in DB, create them (webhook may have failed/delayed)
  if (!dbUser) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      await prismadb.user.create({
        data: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      });
      console.log(`⚠️ [checkAuth] Created user via fallback (webhook may have failed): ${userId}`);
    }
  }

  return userId;
};
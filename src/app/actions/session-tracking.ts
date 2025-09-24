'use server';

import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { logger } from '@/lib/logger';

const SESSION_COOKIE_NAME = 'session-tracked';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Checks if the current session has already been tracked
 */
export async function isSessionTracked(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return false;
  }

  try {
    const timestamp = parseInt(sessionCookie.value);
    const now = Date.now();

    // Check if cookie is still valid (not expired)
    return (now - timestamp) < SESSION_DURATION;
  } catch {
    return false;
  }
}

/**
 * Marks the current session as tracked by setting a cookie
 */
export async function markSessionTracked(): Promise<void> {
  const cookieStore = cookies();
  const timestamp = Date.now().toString();

  cookieStore.set(SESSION_COOKIE_NAME, timestamp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // maxAge is in seconds
  });
}

/**
 * Updates the user's last login timestamp in the database
 * Only call this function if isSessionTracked() returns false
 */
export async function updateUserLoginTimestamp(): Promise<void> {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      logger.warn('Session tracking: No Clerk user ID available');
      return;
    }

    // Check if user exists in database
    const dbUser = await prismadb.user.findUnique({
      where: { id: clerkUser.id }
    });

    if (!dbUser) {
      // User should be created via Clerk webhook, but if not found, just log and return
      logger.warn('Session tracking: User not found in database', { userId: clerkUser.id });
      return;
    }

    // Update the lastLogin timestamp
    await prismadb.user.update({
      where: { id: clerkUser.id },
      data: { lastLogin: new Date() }
    });

    logger.info('Session tracking: Updated user login timestamp', { userId: clerkUser.id });

    // Mark this session as tracked
    await markSessionTracked();

  } catch (error) {
    logger.error('Session tracking: Error updating user login timestamp', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Even if the database update fails, mark the session as tracked
    // to prevent repeated failed attempts
    await markSessionTracked();
  }
}

/**
 * Main function to be called from Server Components or client actions
 * Handles session tracking logic with proper checks
 */
export async function handleSessionTracking(): Promise<void> {
  // Only track if we haven't already tracked this session
  const tracked = await isSessionTracked();
  if (!tracked) {
    await updateUserLoginTimestamp();
  }
}
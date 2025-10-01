'use server';

import { clerkClient } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { checkAuth } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

interface OrphanedUser {
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: number;
}

/**
 * Find all Clerk users that don't have corresponding database records
 */
export async function getOrphanedClerkUsers(): Promise<{
  success: boolean;
  orphanedUsers?: OrphanedUser[];
  error?: string;
}> {
  try {
    // Ensure admin access
    await checkAuth();

    // Get all Clerk users
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500, // Adjust as needed
    });

    // Get all user IDs from database
    const dbUserIds = await prismadb.user.findMany({
      select: { id: true },
    });

    const dbUserIdSet = new Set(dbUserIds.map(u => u.id));

    // Find Clerk users not in database
    const orphaned: OrphanedUser[] = [];
    for (const clerkUser of clerkUsers.data) {
      if (!dbUserIdSet.has(clerkUser.id)) {
        orphaned.push({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
          createdAt: clerkUser.createdAt,
        });
      }
    }

    logger.info('Found orphaned Clerk users', { count: orphaned.length });

    return {
      success: true,
      orphanedUsers: orphaned,
    };
  } catch (error) {
    logger.error('Error finding orphaned Clerk users', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find orphaned users',
    };
  }
}

/**
 * Create a database user record from Clerk user data
 */
export async function createUserFromClerkId(clerkUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Ensure admin access
    await checkAuth();

    // Get Clerk user data
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    if (!clerkUser) {
      return {
        success: false,
        error: 'Clerk user not found',
      };
    }

    // Check if user already exists
    const existingUser = await prismadb.user.findUnique({
      where: { id: clerkUserId },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'User already exists in database',
      };
    }

    // Create database user
    await prismadb.user.create({
      data: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });

    logger.info('Created database user from orphaned Clerk user', { userId: clerkUserId });

    return { success: true };
  } catch (error) {
    logger.error('Error creating user from Clerk ID', {
      clerkUserId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

/**
 * Create database records for all orphaned Clerk users
 */
export async function createAllOrphanedUsers(): Promise<{
  success: boolean;
  created?: number;
  failed?: number;
  error?: string;
}> {
  try {
    // Ensure admin access
    await checkAuth();

    // Get orphaned users
    const result = await getOrphanedClerkUsers();
    if (!result.success || !result.orphanedUsers) {
      return {
        success: false,
        error: result.error || 'Failed to get orphaned users',
      };
    }

    let created = 0;
    let failed = 0;

    // Create each orphaned user
    for (const orphan of result.orphanedUsers) {
      const createResult = await createUserFromClerkId(orphan.clerkId);
      if (createResult.success) {
        created++;
      } else {
        failed++;
        logger.error('Failed to create orphaned user', {
          clerkId: orphan.clerkId,
          error: createResult.error,
        });
      }
    }

    logger.info('Bulk created orphaned users', { created, failed });

    return {
      success: true,
      created,
      failed,
    };
  } catch (error) {
    logger.error('Error in bulk create orphaned users', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk create users',
    };
  }
}

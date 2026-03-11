/**
 * Prisma client for E2E tests.
 *
 * Connects directly to the database using DATABASE_URL from the environment.
 * This replaces dev API routes — files in e2e/ are tracked in git but never
 * included in the Next.js build, so there's no risk of shipping to production.
 */
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

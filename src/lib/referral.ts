import prisma from '@/lib/prismadb';

const REFERRAL_CODE_LENGTH = 6;
const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1 to avoid confusion

/**
 * Generate a random referral code (6 characters, alphanumeric)
 */
export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * REFERRAL_CODE_CHARS.length);
    code += REFERRAL_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== REFERRAL_CODE_LENGTH) return false;

  const validCharsRegex = new RegExp(`^[${REFERRAL_CODE_CHARS}]+$`);
  return validCharsRegex.test(code.toUpperCase());
}

/**
 * Check if a Prisma error is a unique constraint violation
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as any).code === 'P2002'
  );
}

/**
 * Get or create a referral code for a user
 * If the user already has a code, return it
 * Otherwise, generate a new unique code and save it
 *
 * Uses atomic insert with retry on collision - no race conditions
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  // First check if user already has a code
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) {
    return user.referralCode;
  }

  // Generate and attempt to save a unique code
  // Retry on unique constraint violation (handles race conditions)
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode();

    try {
      // Atomic update - if another request already set a code, this will fail
      // with a different error, and if code collides, P2002 is thrown
      const updated = await prisma.user.update({
        where: {
          id: userId,
          referralCode: null, // Only update if no code exists yet
        },
        data: { referralCode: code },
        select: { referralCode: true },
      });

      if (updated.referralCode) {
        return updated.referralCode;
      }
    } catch (error) {
      // P2002 = Unique constraint violation (code already exists)
      if (isUniqueConstraintError(error)) {
        console.log(`[Referral] Code collision on attempt ${attempt + 1}, retrying...`);
        continue;
      }

      // P2025 = Record not found (user doesn't exist or already has a code)
      if ((error as any)?.code === 'P2025') {
        // User might have gotten a code from another request, re-fetch
        const refetched = await prisma.user.findUnique({
          where: { id: userId },
          select: { referralCode: true },
        });

        if (refetched?.referralCode) {
          return refetched.referralCode;
        }
      }

      // Unknown error, rethrow
      throw error;
    }
  }

  throw new Error(`Failed to generate unique referral code after ${maxAttempts} attempts`);
}

/**
 * Find a user by their referral code
 */
export async function findUserByReferralCode(code: string): Promise<{ id: string; firstName: string | null; lastName: string | null } | null> {
  if (!isValidReferralCode(code)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, firstName: true, lastName: true },
  });

  return user;
}

/**
 * Create a referral record linking referrer to referred user
 */
export async function createReferral(referrerId: string, referredUserId: string): Promise<void> {
  // Check if referral already exists
  const existing = await prisma.referral.findUnique({
    where: { referredUserId },
  });

  if (existing) {
    console.log(`[Referral] Referral already exists for user ${referredUserId}`);
    return;
  }

  // Create the referral record
  await prisma.referral.create({
    data: {
      referrerId,
      referredUserId,
      status: 'pending',
    },
  });

  // Update the referred user's referredByUserId
  await prisma.user.update({
    where: { id: referredUserId },
    data: { referredByUserId: referrerId },
  });

  console.log(`[Referral] Created referral: ${referrerId} -> ${referredUserId}`);
}

/**
 * Process a referral when a user creates their first listing
 * This handles the case where a user:
 * 1. Signs up without a referral link
 * 2. Later visits a referral link (cookie gets set)
 * 3. Creates their first listing (becomes a host)
 *
 * @param userId - The user creating the listing
 * @param referralCode - The referral code from cookie (if any)
 * @param skipListingCheck - If true, skip the listing count check (caller has already verified)
 * @returns true if a referral was created, false otherwise
 */
export async function processReferralOnFirstListing(
  userId: string,
  referralCode: string | null | undefined,
  skipListingCheck: boolean = false
): Promise<boolean> {
  // No referral code provided
  if (!referralCode || !isValidReferralCode(referralCode)) {
    return false;
  }

  // Check if user already has a referral record (was referred at signup)
  const existingReferral = await prisma.referral.findUnique({
    where: { referredUserId: userId },
  });

  if (existingReferral) {
    console.log(`[Referral] User ${userId} already has a referral record`);
    return false;
  }

  // Check if this is the user's first listing (unless caller has already verified)
  if (!skipListingCheck) {
    const existingListingCount = await prisma.listing.count({
      where: { userId },
    });

    if (existingListingCount > 0) {
      console.log(`[Referral] User ${userId} already has ${existingListingCount} listing(s)`);
      return false;
    }
  }

  // Find the referrer by code
  const referrer = await findUserByReferralCode(referralCode);

  if (!referrer) {
    console.log(`[Referral] No user found with referral code ${referralCode}`);
    return false;
  }

  // Prevent self-referral
  if (referrer.id === userId) {
    console.log(`[Referral] Self-referral attempt blocked for user ${userId}`);
    return false;
  }

  // Create the referral
  await createReferral(referrer.id, userId);
  console.log(`[Referral] Created referral on first listing: ${referrer.id} -> ${userId}`);
  return true;
}

/**
 * Qualify a referral when the referred user gets their first booking
 * @param referredUserId - The user ID of the referred host
 * @param bookingId - The booking ID that qualified the referral
 * @returns true if a referral was qualified, false otherwise
 */
export async function qualifyReferral(referredUserId: string, bookingId: string): Promise<boolean> {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
  });

  if (!referral) {
    return false;
  }

  if (referral.status !== 'pending') {
    // Already qualified or paid
    return false;
  }

  // Calculate payout quarter
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const payoutQuarter = `${now.getFullYear()}-Q${quarter}`;

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: 'qualified',
      qualifiedAt: now,
      qualifyingBookingId: bookingId,
      payoutQuarter,
    },
  });

  console.log(`[Referral] Qualified referral ${referral.id} for payout in ${payoutQuarter} (booking: ${bookingId})`);
  return true;
}

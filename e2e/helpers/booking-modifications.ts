/**
 * Booking Modifications E2E Helpers
 *
 * Creates booking and payment modification fixtures directly via Prisma
 * so the host-side approval/rejection UI can be tested without going
 * through the full renter request flow.
 *
 * TODO: Eventually replace the Prisma fixtures with actual renter e2e user
 * interactions once the renter modification request UI is fully testable.
 */
import { getTestPrisma } from './prisma';

export interface BookingModificationFixture {
  id: string;
  bookingId: string;
  requestorId: string;
  recipientId: string;
  status: string;
}

export interface PaymentModificationFixture {
  id: string;
  rentPaymentId: string;
  requestorId: string;
  recipientId: string;
  status: string;
}

/**
 * Find an active booking hosted by the given host email.
 * Returns the booking along with the host userId and listing info.
 */
export async function findActiveBookingForHost(hostEmail: string): Promise<{
  bookingId: string;
  bookingUserId: string;
  hostId: string;
  listingId: string;
  listingTitle: string;
  startDate: Date;
  endDate: Date;
} | null> {
  const prisma = getTestPrisma();

  const host = await prisma.user.findFirst({
    where: { email: hostEmail },
    select: { id: true },
  });

  if (!host) return null;

  // Find a booking on one of this host's listings
  const booking = await prisma.booking.findFirst({
    where: {
      listing: { userId: host.id },
      status: { in: ['confirmed', 'active', 'reserved'] },
    },
    include: {
      listing: { select: { id: true, title: true, userId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!booking) return null;

  // Ensure booking has monthlyRent set (needed for date change approval recalculation)
  if (!booking.monthlyRent) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { monthlyRent: 1000 }, // $1000/month default for test
    });
  }

  return {
    bookingId: booking.id,
    bookingUserId: booking.userId,
    hostId: host.id,
    listingId: booking.listing.id,
    listingTitle: booking.listing.title,
    startDate: booking.startDate,
    endDate: booking.endDate,
  };
}

/**
 * Look up a user ID by email.
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  const prisma = getTestPrisma();
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Create a booking (date) modification request via Prisma.
 *
 * This simulates a renter requesting to change their move-in/move-out dates.
 * The host is set as the recipient so they can approve/reject.
 *
 * TODO: Replace this with actual renter e2e user interaction once the renter
 * modification request UI is fully testable end-to-end.
 */
export async function createBookingModificationFixture({
  bookingId,
  requestorId,
  recipientId,
  originalStartDate,
  originalEndDate,
  newStartDate,
  newEndDate,
  reason,
}: {
  bookingId: string;
  requestorId: string;
  recipientId: string;
  originalStartDate: Date;
  originalEndDate: Date;
  newStartDate: Date;
  newEndDate: Date;
  reason?: string;
}): Promise<BookingModificationFixture> {
  const prisma = getTestPrisma();

  const modification = await prisma.bookingModification.create({
    data: {
      bookingId,
      requestorId,
      recipientId,
      originalStartDate,
      originalEndDate,
      newStartDate,
      newEndDate,
      reason: reason || 'E2E test: requesting date change',
      status: 'pending',
    },
  });

  return {
    id: modification.id,
    bookingId: modification.bookingId,
    requestorId: modification.requestorId,
    recipientId: modification.recipientId,
    status: modification.status,
  };
}

/**
 * Create a payment modification request via Prisma.
 *
 * This simulates a renter requesting to change a rent payment amount/due date.
 * The host is set as the recipient so they can approve/reject.
 *
 * TODO: Replace this with actual renter e2e user interaction once the renter
 * modification request UI is fully testable end-to-end.
 */
export async function createPaymentModificationFixture({
  rentPaymentId,
  requestorId,
  recipientId,
  originalAmount,
  originalDueDate,
  newAmount,
  newDueDate,
  reason,
}: {
  rentPaymentId: string;
  requestorId: string;
  recipientId: string;
  originalAmount: number;
  originalDueDate: Date;
  newAmount: number;
  newDueDate: Date;
  reason?: string;
}): Promise<PaymentModificationFixture> {
  const prisma = getTestPrisma();

  const modification = await prisma.paymentModification.create({
    data: {
      rentPaymentId,
      requestorId,
      recipientId,
      originalAmount,
      originalDueDate,
      newAmount,
      newDueDate,
      reason: reason || 'E2E test: requesting payment change',
      status: 'pending',
    },
  });

  return {
    id: modification.id,
    rentPaymentId: modification.rentPaymentId,
    requestorId: modification.requestorId,
    recipientId: modification.recipientId,
    status: modification.status,
  };
}

/**
 * Find a rent payment for a booking that can be used for payment modification tests.
 * Prefers unpaid, non-cancelled payments.
 */
export async function findRentPaymentForBooking(bookingId: string): Promise<{
  id: string;
  amount: number;
  dueDate: Date;
} | null> {
  const prisma = getTestPrisma();

  const payment = await prisma.rentPayment.findFirst({
    where: {
      bookingId,
      cancelledAt: null,
      isPaid: false,
    },
    orderBy: { dueDate: 'asc' },
    select: { id: true, amount: true, dueDate: true },
  });

  return payment;
}

/**
 * Get the current status of a booking modification.
 */
export async function getBookingModificationStatus(modificationId: string): Promise<string | null> {
  const prisma = getTestPrisma();

  const mod = await prisma.bookingModification.findUnique({
    where: { id: modificationId },
    select: { status: true },
  });

  return mod?.status ?? null;
}

/**
 * Get the current status of a payment modification.
 */
export async function getPaymentModificationStatus(modificationId: string): Promise<string | null> {
  const prisma = getTestPrisma();

  const mod = await prisma.paymentModification.findUnique({
    where: { id: modificationId },
    select: { status: true },
  });

  return mod?.status ?? null;
}

/**
 * Clean up test modifications created during e2e tests.
 */
export async function cleanupTestModifications(modificationIds: string[]): Promise<void> {
  const prisma = getTestPrisma();

  // Delete booking modifications
  await prisma.bookingModification.deleteMany({
    where: { id: { in: modificationIds } },
  });
}

/**
 * Clean up test payment modifications created during e2e tests.
 */
export async function cleanupTestPaymentModifications(modificationIds: string[]): Promise<void> {
  const prisma = getTestPrisma();

  await prisma.paymentModification.deleteMany({
    where: { id: { in: modificationIds } },
  });
}

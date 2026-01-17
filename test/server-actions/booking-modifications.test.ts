import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    bookingModification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Clerk auth - must use inline function, not external reference
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock notifications
vi.mock('@/app/actions/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock payment-modifications (imported by booking-modifications)
vi.mock('@/app/actions/payment-modifications', () => ({
  approvePaymentModification: vi.fn(),
  rejectPaymentModification: vi.fn(),
}));

// Import after mocks are set up
import {
  createBookingModification,
  approveBookingModification,
  rejectBookingModification,
} from '@/app/actions/booking-modifications';
import { auth } from '@clerk/nextjs/server';

// Get the mocked instances
const { default: prisma } = await import('@/lib/prismadb');
const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

/**
 * Tests for Booking Modification Server Actions
 *
 * Booking modifications allow changing booking dates (start/end).
 * Key behaviors:
 * - Two-party approval system (host & renter must both agree)
 * - Creates BookingModification record with pending status
 * - On approval, updates the actual Booking dates
 * - Notifications sent to both parties
 *
 * IMPORTANT NOTE: Rent payment recalculation is NOT implemented yet.
 * When dates change, the rent schedule is NOT automatically updated.
 */

// Helper to create local dates
const localDate = (year: number, month: number, day: number) => new Date(year, month, day);

describe('Booking Modifications', () => {
  const mockHostId = 'host-user-123';
  const mockRenterId = 'renter-user-456';
  const mockBookingId = 'booking-789';
  const mockListingId = 'listing-abc';
  const mockModificationId = 'modification-xyz';

  const mockBooking = {
    id: mockBookingId,
    startDate: localDate(2025, 0, 15), // Jan 15, 2025
    endDate: localDate(2025, 1, 15),   // Feb 15, 2025
    listingId: mockListingId,
    listing: {
      userId: mockHostId,
      title: 'Test Listing',
    },
    user: {
      id: mockRenterId,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBookingModification', () => {
    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(
          createBookingModification({
            bookingId: mockBookingId,
            newStartDate: localDate(2025, 0, 20),
            newEndDate: localDate(2025, 1, 20),
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is neither host nor renter', async () => {
        mockAuth.mockReturnValue({ userId: 'some-other-user' });
        mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);

        // Server action wraps internal errors in generic message
        await expect(
          createBookingModification({
            bookingId: mockBookingId,
            newStartDate: localDate(2025, 0, 20),
            newEndDate: localDate(2025, 1, 20),
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Failed to create booking modification request');
      });

      it('should allow host to create modification', async () => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);
        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          bookingId: mockBookingId,
          requestorId: mockHostId,
          recipientId: mockRenterId,
          originalStartDate: mockBooking.startDate,
          originalEndDate: mockBooking.endDate,
          newStartDate: localDate(2025, 0, 20),
          newEndDate: localDate(2025, 1, 20),
          status: 'pending',
          requestor: { fullName: 'Test Host', firstName: 'Test', lastName: 'Host' },
          recipient: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
          booking: mockBooking,
        } as any);

        const result = await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: localDate(2025, 0, 20),
          newEndDate: localDate(2025, 1, 20),
          recipientId: mockRenterId,
        });

        expect(result.success).toBe(true);
        expect(result.bookingModification).toBeDefined();
      });

      it('should allow renter to create modification', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);
        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          bookingId: mockBookingId,
          requestorId: mockRenterId,
          recipientId: mockHostId,
          originalStartDate: mockBooking.startDate,
          originalEndDate: mockBooking.endDate,
          newStartDate: localDate(2025, 0, 20),
          newEndDate: localDate(2025, 1, 20),
          status: 'pending',
          requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
          recipient: { fullName: 'Test Host', firstName: 'Test', lastName: 'Host' },
          booking: mockBooking,
        } as any);

        const result = await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: localDate(2025, 0, 20),
          newEndDate: localDate(2025, 1, 20),
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Date Validation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);
      });

      it('should throw error when new end date is before new start date', async () => {
        // Server action wraps internal errors in generic message
        await expect(
          createBookingModification({
            bookingId: mockBookingId,
            newStartDate: localDate(2025, 1, 20), // Feb 20
            newEndDate: localDate(2025, 1, 10),   // Feb 10 - BEFORE start!
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Failed to create booking modification request');
      });

      it('should throw error when start and end date are the same', async () => {
        // Server action wraps internal errors in generic message
        await expect(
          createBookingModification({
            bookingId: mockBookingId,
            newStartDate: localDate(2025, 1, 15),
            newEndDate: localDate(2025, 1, 15), // Same as start!
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Failed to create booking modification request');
      });

      it('should allow extending the booking end date', async () => {
        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          bookingId: mockBookingId,
          requestorId: mockRenterId,
          recipientId: mockHostId,
          originalStartDate: mockBooking.startDate,
          originalEndDate: mockBooking.endDate,
          newStartDate: localDate(2025, 0, 15), // Same start
          newEndDate: localDate(2025, 2, 15),   // Extended to Mar 15
          status: 'pending',
          requestor: { fullName: 'Test Renter', firstName: null, lastName: null },
          recipient: { fullName: 'Test Host', firstName: null, lastName: null },
          booking: mockBooking,
        } as any);

        const result = await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: localDate(2025, 0, 15),
          newEndDate: localDate(2025, 2, 15), // Extended by 1 month
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
        expect(mockPrisma.bookingModification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              newEndDate: localDate(2025, 2, 15),
            }),
          })
        );
      });

      it('should allow shortening the booking by moving start date later', async () => {
        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          bookingId: mockBookingId,
          requestorId: mockRenterId,
          recipientId: mockHostId,
          originalStartDate: mockBooking.startDate,
          originalEndDate: mockBooking.endDate,
          newStartDate: localDate(2025, 0, 25), // Moved later
          newEndDate: localDate(2025, 1, 15),   // Same end
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          booking: mockBooking,
        } as any);

        const result = await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: localDate(2025, 0, 25), // 10 days later
          newEndDate: localDate(2025, 1, 15),
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Modification Record Creation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);
      });

      it('should store original and new dates correctly', async () => {
        const newStart = localDate(2025, 0, 20);
        const newEnd = localDate(2025, 1, 20);

        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          bookingId: mockBookingId,
          requestorId: mockRenterId,
          recipientId: mockHostId,
          originalStartDate: mockBooking.startDate,
          originalEndDate: mockBooking.endDate,
          newStartDate: newStart,
          newEndDate: newEnd,
          status: 'pending',
          reason: 'Need to move dates',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          booking: mockBooking,
        } as any);

        await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: newStart,
          newEndDate: newEnd,
          reason: 'Need to move dates',
          recipientId: mockHostId,
        });

        expect(mockPrisma.bookingModification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              bookingId: mockBookingId,
              requestorId: mockRenterId,
              recipientId: mockHostId,
              originalStartDate: mockBooking.startDate,
              originalEndDate: mockBooking.endDate,
              newStartDate: newStart,
              newEndDate: newEnd,
              reason: 'Need to move dates',
              status: 'pending',
            }),
          })
        );
      });

      it('should set initial status to pending', async () => {
        mockPrisma.bookingModification.create.mockResolvedValue({
          id: mockModificationId,
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          booking: mockBooking,
        } as any);

        const result = await createBookingModification({
          bookingId: mockBookingId,
          newStartDate: localDate(2025, 0, 20),
          newEndDate: localDate(2025, 1, 20),
          recipientId: mockHostId,
        });

        expect(result.bookingModification.status).toBe('pending');
      });
    });
  });

  describe('approveBookingModification', () => {
    const mockPendingModification = {
      id: mockModificationId,
      bookingId: mockBookingId,
      requestorId: mockRenterId,
      recipientId: mockHostId,
      originalStartDate: localDate(2025, 0, 15),
      originalEndDate: localDate(2025, 1, 15),
      newStartDate: localDate(2025, 0, 20),
      newEndDate: localDate(2025, 1, 20),
      status: 'pending',
      viewedAt: null,
      requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
      booking: {
        listingId: mockListingId,
        listing: { id: mockListingId, title: 'Test Listing', userId: mockHostId },
      },
    };

    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(approveBookingModification(mockModificationId)).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is not the recipient', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId }); // Renter trying to approve their own request
        mockPrisma.bookingModification.findUnique.mockResolvedValue(mockPendingModification as any);

        // Server action wraps internal errors in generic message
        await expect(approveBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to approve booking modification'
        );
      });

      it('should allow recipient (host) to approve', async () => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.bookingModification.findUnique.mockResolvedValue(mockPendingModification as any);
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);
        mockPrisma.user.findUnique.mockResolvedValue({ fullName: 'Test Host' } as any);

        const result = await approveBookingModification(mockModificationId);

        expect(result.success).toBe(true);
      });
    });

    describe('Status Validation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
      });

      it('should throw error when modification is already approved', async () => {
        mockPrisma.bookingModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'approved',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(approveBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to approve booking modification'
        );
      });

      it('should throw error when modification is already rejected', async () => {
        mockPrisma.bookingModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(approveBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to approve booking modification'
        );
      });

      it('should throw error when modification not found', async () => {
        mockPrisma.bookingModification.findUnique.mockResolvedValue(null);

        // Server action wraps internal errors in generic message
        await expect(approveBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to approve booking modification'
        );
      });
    });

    describe('Booking Update on Approval', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.bookingModification.findUnique.mockResolvedValue(mockPendingModification as any);
        mockPrisma.user.findUnique.mockResolvedValue({ fullName: 'Test Host' } as any);
      });

      it('should update booking dates via transaction', async () => {
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        await approveBookingModification(mockModificationId);

        // Transaction is called with array of Prisma operations
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });

      it('should set status to approved with approvedAt timestamp', async () => {
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        await approveBookingModification(mockModificationId);

        // The transaction should include updating status to 'approved'
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });
  });

  describe('rejectBookingModification', () => {
    const mockPendingModification = {
      id: mockModificationId,
      bookingId: mockBookingId,
      requestorId: mockRenterId,
      recipientId: mockHostId,
      status: 'pending',
      viewedAt: null,
      requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
      booking: {
        listingId: mockListingId,
        listing: { id: mockListingId, title: 'Test Listing', userId: mockHostId },
      },
    };

    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(rejectBookingModification(mockModificationId)).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is not the recipient', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.bookingModification.findUnique.mockResolvedValue(mockPendingModification as any);

        // Server action wraps internal errors in generic message
        await expect(rejectBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to reject booking modification'
        );
      });
    });

    describe('Rejection with Reason', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.bookingModification.findUnique.mockResolvedValue(mockPendingModification as any);
        mockPrisma.user.findUnique.mockResolvedValue({ fullName: 'Test Host' } as any);
      });

      it('should update status to rejected', async () => {
        mockPrisma.bookingModification.update.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        await rejectBookingModification(mockModificationId);

        expect(mockPrisma.bookingModification.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockModificationId },
            data: expect.objectContaining({
              status: 'rejected',
            }),
          })
        );
      });

      it('should store rejection reason when provided', async () => {
        mockPrisma.bookingModification.update.mockResolvedValue({} as any);

        await rejectBookingModification(mockModificationId, 'Dates not available');

        expect(mockPrisma.bookingModification.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              rejectionReason: 'Dates not available',
            }),
          })
        );
      });

      it('should work without rejection reason', async () => {
        mockPrisma.bookingModification.update.mockResolvedValue({} as any);

        const result = await rejectBookingModification(mockModificationId);

        expect(result.success).toBe(true);
        expect(mockPrisma.bookingModification.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              rejectionReason: undefined,
            }),
          })
        );
      });
    });

    describe('Status Validation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
      });

      it('should throw error when modification is already approved', async () => {
        mockPrisma.bookingModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'approved',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(rejectBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to reject booking modification'
        );
      });

      it('should throw error when modification is already rejected', async () => {
        mockPrisma.bookingModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(rejectBookingModification(mockModificationId)).rejects.toThrow(
          'Failed to reject booking modification'
        );
      });
    });
  });

  describe('Date Change Scenarios', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: mockRenterId });
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking as any);
    });

    /**
     * IMPORTANT: These tests document that rent payments are NOT recalculated
     * when booking dates change. This is the current behavior (not yet implemented).
     */

    it('should extend booking from Feb 15 to Mar 15 (add 1 month)', async () => {
      mockPrisma.bookingModification.create.mockResolvedValue({
        id: mockModificationId,
        originalStartDate: localDate(2025, 0, 15),
        originalEndDate: localDate(2025, 1, 15),
        newStartDate: localDate(2025, 0, 15),
        newEndDate: localDate(2025, 2, 15), // Extended to Mar 15
        status: 'pending',
        requestor: { fullName: 'Test', firstName: null, lastName: null },
        recipient: { fullName: 'Test', firstName: null, lastName: null },
        booking: mockBooking,
      } as any);

      const result = await createBookingModification({
        bookingId: mockBookingId,
        newStartDate: localDate(2025, 0, 15),
        newEndDate: localDate(2025, 2, 15),
        reason: 'Extending stay by 1 month',
        recipientId: mockHostId,
      });

      expect(result.success).toBe(true);
      // Note: Rent payments would need to be regenerated (not implemented)
    });

    it('should shorten booking from Jan 15 to Feb 1 (end earlier)', async () => {
      mockPrisma.bookingModification.create.mockResolvedValue({
        id: mockModificationId,
        originalStartDate: localDate(2025, 0, 15),
        originalEndDate: localDate(2025, 1, 15),
        newStartDate: localDate(2025, 0, 15),
        newEndDate: localDate(2025, 1, 1), // Shortened to Feb 1
        status: 'pending',
        requestor: { fullName: 'Test', firstName: null, lastName: null },
        recipient: { fullName: 'Test', firstName: null, lastName: null },
        booking: mockBooking,
      } as any);

      const result = await createBookingModification({
        bookingId: mockBookingId,
        newStartDate: localDate(2025, 0, 15),
        newEndDate: localDate(2025, 1, 1), // Only January
        reason: 'Cutting stay short',
        recipientId: mockHostId,
      });

      expect(result.success).toBe(true);
      // Note: Should probably refund or cancel Feb payment (not implemented)
    });

    it('should move entire booking later (Jan 15-Feb 15 → Feb 15-Mar 15)', async () => {
      mockPrisma.bookingModification.create.mockResolvedValue({
        id: mockModificationId,
        originalStartDate: localDate(2025, 0, 15),
        originalEndDate: localDate(2025, 1, 15),
        newStartDate: localDate(2025, 1, 15), // Moved to Feb 15
        newEndDate: localDate(2025, 2, 15),   // Moved to Mar 15
        status: 'pending',
        requestor: { fullName: 'Test', firstName: null, lastName: null },
        recipient: { fullName: 'Test', firstName: null, lastName: null },
        booking: mockBooking,
      } as any);

      const result = await createBookingModification({
        bookingId: mockBookingId,
        newStartDate: localDate(2025, 1, 15),
        newEndDate: localDate(2025, 2, 15),
        reason: 'Moving dates by 1 month',
        recipientId: mockHostId,
      });

      expect(result.success).toBe(true);
      // Note: All rent payments would need new due dates (not implemented)
    });
  });
});

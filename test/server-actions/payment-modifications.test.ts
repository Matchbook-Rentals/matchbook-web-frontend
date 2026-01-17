import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prismadb', () => ({
  default: {
    rentPayment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentModification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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

// Import after mocks are set up
import {
  createPaymentModification,
  approvePaymentModification,
  rejectPaymentModification,
} from '@/app/actions/payment-modifications';
import { auth } from '@clerk/nextjs/server';

// Get the mocked instances
const { default: prisma } = await import('@/lib/prismadb');
const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

/**
 * Tests for Payment Modification Server Actions
 *
 * Payment modifications allow changing individual rent payment amounts and due dates.
 * Key behaviors:
 * - Two-party approval system (host & renter must agree)
 * - Creates PaymentModification record with pending status
 * - On approval, updates the RentPayment amount and dueDate
 * - Tracks original values for audit trail
 */

// Helper to create local dates
const localDate = (year: number, month: number, day: number) => new Date(year, month, day);

describe('Payment Modifications', () => {
  const mockHostId = 'host-user-123';
  const mockRenterId = 'renter-user-456';
  const mockBookingId = 'booking-789';
  const mockPaymentId = 'payment-abc';
  const mockModificationId = 'modification-xyz';

  const mockRentPayment = {
    id: mockPaymentId,
    bookingId: mockBookingId,
    amount: 1000,
    dueDate: localDate(2025, 1, 1), // Feb 1, 2025
    type: 'MONTHLY_RENT',
    booking: {
      listing: {
        userId: mockHostId,
      },
      user: {
        id: mockRenterId,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentModification', () => {
    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(
          createPaymentModification({
            rentPaymentId: mockPaymentId,
            newAmount: 900,
            newDueDate: localDate(2025, 1, 5),
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is neither host nor renter', async () => {
        mockAuth.mockReturnValue({ userId: 'some-other-user' });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);

        // Server action wraps internal errors in generic message
        await expect(
          createPaymentModification({
            rentPaymentId: mockPaymentId,
            newAmount: 900,
            newDueDate: localDate(2025, 1, 5),
            recipientId: mockHostId,
          })
        ).rejects.toThrow('Failed to create payment modification request');
      });

      it('should allow host to create payment modification', async () => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          rentPaymentId: mockPaymentId,
          requestorId: mockHostId,
          recipientId: mockRenterId,
          originalAmount: 1000,
          originalDueDate: localDate(2025, 1, 1),
          newAmount: 900,
          newDueDate: localDate(2025, 1, 5),
          status: 'pending',
          requestor: { fullName: 'Test Host', firstName: 'Test', lastName: 'Host' },
          recipient: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
          rentPayment: {
            booking: {
              listing: { title: 'Test Listing' },
            },
          },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 900,
          newDueDate: localDate(2025, 1, 5),
          recipientId: mockRenterId,
        });

        expect(result.success).toBe(true);
        expect(result.paymentModification).toBeDefined();
      });

      it('should allow renter to create payment modification', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          rentPaymentId: mockPaymentId,
          requestorId: mockRenterId,
          recipientId: mockHostId,
          originalAmount: 1000,
          originalDueDate: localDate(2025, 1, 1),
          newAmount: 800,
          newDueDate: localDate(2025, 1, 10),
          status: 'pending',
          requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
          recipient: { fullName: 'Test Host', firstName: 'Test', lastName: 'Host' },
          rentPayment: {
            booking: {
              listing: { title: 'Test Listing' },
            },
          },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 800,
          newDueDate: localDate(2025, 1, 10),
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Modification Record Creation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
      });

      it('should store original and new amounts correctly', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          originalDueDate: localDate(2025, 1, 1),
          newAmount: 750,
          newDueDate: localDate(2025, 1, 1),
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 750,
          newDueDate: localDate(2025, 1, 1),
          recipientId: mockHostId,
        });

        expect(mockPrisma.paymentModification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              rentPaymentId: mockPaymentId,
              originalAmount: 1000,
              originalDueDate: mockRentPayment.dueDate,
              newAmount: 750,
              status: 'pending',
            }),
          })
        );
      });

      it('should store reason when provided', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          reason: 'Partial payment agreement',
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 500,
          newDueDate: localDate(2025, 1, 1),
          reason: 'Partial payment agreement',
          recipientId: mockHostId,
        });

        expect(mockPrisma.paymentModification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              reason: 'Partial payment agreement',
            }),
          })
        );
      });

      it('should set initial status to pending', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 900,
          newDueDate: localDate(2025, 1, 1),
          recipientId: mockHostId,
        });

        expect(result.paymentModification.status).toBe('pending');
      });
    });

    describe('Payment Amount Scenarios', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
      });

      it('should allow reducing payment amount', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 500,
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 500, // 50% reduction
          newDueDate: localDate(2025, 1, 1),
          reason: 'Agreement to reduce rent',
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });

      it('should allow increasing payment amount', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 1200,
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 1200, // Increase for late fee
          newDueDate: localDate(2025, 1, 1),
          reason: 'Late fee added',
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });

      it('should allow changing due date only (same amount)', async () => {
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 1000,
          originalDueDate: localDate(2025, 1, 1),
          newDueDate: localDate(2025, 1, 15),
          status: 'pending',
          requestor: { fullName: 'Test', firstName: null, lastName: null },
          recipient: { fullName: 'Test', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 1000, // Same amount
          newDueDate: localDate(2025, 1, 15), // New due date
          reason: 'Extension requested',
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('approvePaymentModification', () => {
    const mockPendingModification = {
      id: mockModificationId,
      rentPaymentId: mockPaymentId,
      requestorId: mockRenterId,
      recipientId: mockHostId,
      originalAmount: 1000,
      originalDueDate: localDate(2025, 1, 1),
      newAmount: 800,
      newDueDate: localDate(2025, 1, 10),
      status: 'pending',
      viewedAt: null,
      requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
      rentPayment: {
        bookingId: mockBookingId,
        booking: {
          listing: { title: 'Test Listing' },
        },
      },
    };

    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(approvePaymentModification(mockModificationId)).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is not the recipient', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId }); // Requester trying to approve own request
        mockPrisma.paymentModification.findUnique.mockResolvedValue(mockPendingModification as any);

        // Server action wraps internal errors in generic message
        await expect(approvePaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to approve payment modification'
        );
      });

      it('should allow recipient to approve', async () => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.paymentModification.findUnique.mockResolvedValue(mockPendingModification as any);
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        const result = await approvePaymentModification(mockModificationId);

        expect(result.success).toBe(true);
      });
    });

    describe('Status Validation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
      });

      it('should throw error when modification is already approved', async () => {
        mockPrisma.paymentModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'approved',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(approvePaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to approve payment modification'
        );
      });

      it('should throw error when modification is already rejected', async () => {
        mockPrisma.paymentModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(approvePaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to approve payment modification'
        );
      });

      it('should throw error when modification not found', async () => {
        mockPrisma.paymentModification.findUnique.mockResolvedValue(null);

        // Server action wraps internal errors in generic message
        await expect(approvePaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to approve payment modification'
        );
      });
    });

    describe('Payment Update on Approval', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.paymentModification.findUnique.mockResolvedValue(mockPendingModification as any);
      });

      it('should update rent payment via transaction', async () => {
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        await approvePaymentModification(mockModificationId);

        // Transaction is called with array of Prisma operations
        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });
  });

  describe('rejectPaymentModification', () => {
    const mockPendingModification = {
      id: mockModificationId,
      rentPaymentId: mockPaymentId,
      requestorId: mockRenterId,
      recipientId: mockHostId,
      status: 'pending',
      viewedAt: null,
      requestor: { fullName: 'Test Renter', firstName: 'Test', lastName: 'Renter' },
      rentPayment: {
        bookingId: mockBookingId,
        booking: {
          listing: { title: 'Test Listing' },
        },
      },
    };

    describe('Authorization', () => {
      it('should throw error when user is not authenticated', async () => {
        mockAuth.mockReturnValue({ userId: null });

        await expect(rejectPaymentModification(mockModificationId)).rejects.toThrow('Unauthorized');
      });

      it('should throw error when user is not the recipient', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.paymentModification.findUnique.mockResolvedValue(mockPendingModification as any);

        // Server action wraps internal errors in generic message
        await expect(rejectPaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to reject payment modification'
        );
      });
    });

    describe('Rejection with Reason', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.paymentModification.findUnique.mockResolvedValue(mockPendingModification as any);
      });

      it('should update status to rejected', async () => {
        mockPrisma.paymentModification.update.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        await rejectPaymentModification(mockModificationId);

        expect(mockPrisma.paymentModification.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockModificationId },
            data: expect.objectContaining({
              status: 'rejected',
            }),
          })
        );
      });

      it('should store rejection reason when provided', async () => {
        mockPrisma.paymentModification.update.mockResolvedValue({} as any);

        await rejectPaymentModification(mockModificationId, 'Cannot reduce payment');

        expect(mockPrisma.paymentModification.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              rejectionReason: 'Cannot reduce payment',
            }),
          })
        );
      });

      it('should work without rejection reason', async () => {
        mockPrisma.paymentModification.update.mockResolvedValue({} as any);

        const result = await rejectPaymentModification(mockModificationId);

        expect(result.success).toBe(true);
      });
    });

    describe('Status Validation', () => {
      beforeEach(() => {
        mockAuth.mockReturnValue({ userId: mockHostId });
      });

      it('should throw error when modification is already approved', async () => {
        mockPrisma.paymentModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'approved',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(rejectPaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to reject payment modification'
        );
      });

      it('should throw error when modification is already rejected', async () => {
        mockPrisma.paymentModification.findUnique.mockResolvedValue({
          ...mockPendingModification,
          status: 'rejected',
        } as any);

        // Server action wraps internal errors in generic message
        await expect(rejectPaymentModification(mockModificationId)).rejects.toThrow(
          'Failed to reject payment modification'
        );
      });
    });
  });

  describe('Real-World Scenarios', () => {
    describe('Prorated Refund Scenario', () => {
      /**
       * Scenario: Guest leaves early, host agrees to partial refund.
       * Original: $1000 for full month (Feb 1)
       * New: $500 for half month (guest left Feb 15)
       */
      it('should handle prorated refund for early departure', async () => {
        const partialPayment = {
          ...mockRentPayment,
          amount: 1000,
          dueDate: localDate(2025, 1, 1),
        };

        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(partialPayment as any);
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 500,
          reason: 'Guest departed early on Feb 15, prorated refund',
          status: 'pending',
          requestor: { fullName: 'Test Host', firstName: null, lastName: null },
          recipient: { fullName: 'Test Renter', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 500, // Half month refund
          newDueDate: localDate(2025, 1, 1),
          reason: 'Guest departed early on Feb 15, prorated refund',
          recipientId: mockRenterId,
        });

        expect(result.success).toBe(true);
        expect(result.paymentModification.newAmount).toBe(500);
      });
    });

    describe('Late Fee Scenario', () => {
      /**
       * Scenario: Guest pays late, host adds late fee.
       * Original: $1000 due Feb 1
       * New: $1100 (includes $100 late fee)
       */
      it('should handle late fee addition', async () => {
        mockAuth.mockReturnValue({ userId: mockHostId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 1100,
          reason: 'Late fee: $100 (payment was 10 days late)',
          status: 'pending',
          requestor: { fullName: 'Test Host', firstName: null, lastName: null },
          recipient: { fullName: 'Test Renter', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 1100,
          newDueDate: localDate(2025, 1, 1),
          reason: 'Late fee: $100 (payment was 10 days late)',
          recipientId: mockRenterId,
        });

        expect(result.success).toBe(true);
        expect(result.paymentModification.newAmount).toBe(1100);
      });
    });

    describe('Payment Extension Scenario', () => {
      /**
       * Scenario: Guest requests extension on due date.
       * Original: $1000 due Feb 1
       * New: $1000 due Feb 15 (same amount, later date)
       */
      it('should handle due date extension', async () => {
        mockAuth.mockReturnValue({ userId: mockRenterId });
        mockPrisma.rentPayment.findUnique.mockResolvedValue(mockRentPayment as any);
        mockPrisma.paymentModification.create.mockResolvedValue({
          id: mockModificationId,
          originalAmount: 1000,
          newAmount: 1000,
          originalDueDate: localDate(2025, 1, 1),
          newDueDate: localDate(2025, 1, 15),
          reason: 'Requesting 2 week extension due to payroll delay',
          status: 'pending',
          requestor: { fullName: 'Test Renter', firstName: null, lastName: null },
          recipient: { fullName: 'Test Host', firstName: null, lastName: null },
          rentPayment: { booking: { listing: { title: 'Test' } } },
        } as any);

        const result = await createPaymentModification({
          rentPaymentId: mockPaymentId,
          newAmount: 1000, // Same amount
          newDueDate: localDate(2025, 1, 15), // Extended 2 weeks
          reason: 'Requesting 2 week extension due to payroll delay',
          recipientId: mockHostId,
        });

        expect(result.success).toBe(true);
      });
    });
  });
});

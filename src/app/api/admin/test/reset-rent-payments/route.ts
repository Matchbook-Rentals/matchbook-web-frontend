import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

/**
 * Admin Test Route: Reset Rent Payments
 *
 * WARNING: Only works in development mode
 *
 * Purpose:
 * - Deletes all existing rent payments
 * - Creates a specific set of test rent payments for testing scenarios
 *
 * Test Scenarios Created:
 * - Overdue payment (Oct 12, 2025 - in the past)
 * - Current/future payments (Nov 1, Dec 1)
 * - Payments without payment methods (stripePaymentMethodId = null)
 * - Different amounts and bookings
 */
export async function POST(request: Request) {
  // SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    console.log('🧪 [Test Route] Resetting rent payments...');

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Delete all existing rent payments
      const deleteResult = await tx.rentPayment.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.count} existing rent payments`);

      // Step 2: Create test rent payments
      const testPayments = [
        {
          id: 'cmgmuub4q0001fcv0jl1ac35s',
          bookingId: '421ef6b1-f326-49b2-9d79-0c8172b7c105',
          amount: 1648,
          dueDate: new Date('2025-11-01T00:00:00.000Z'),
          isPaid: false,
          retryCount: 0,
          createdAt: new Date('2025-10-11T22:36:25.940Z'),
          updatedAt: new Date('2025-10-11T22:36:25.940Z'),
        },
        {
          id: 'cmgmuub600003fcv0sevtthw9',
          bookingId: '421ef6b1-f326-49b2-9d79-0c8172b7c105',
          amount: 2658,
          dueDate: new Date('2025-10-12T00:00:00.000Z'), // OVERDUE - in the past
          isPaid: false,
          retryCount: 0,
          createdAt: new Date('2025-10-11T22:36:25.940Z'),
          updatedAt: new Date('2025-10-11T22:36:25.940Z'),
        },
        {
          id: 'cmgmwaaxa0005fcv0zcgs0k8i',
          bookingId: 'd9d704d1-6d15-4264-9c53-417b08ed1c03',
          amount: 3,
          dueDate: new Date('2025-12-01T00:00:00.000Z'),
          isPaid: false,
          retryCount: 0,
          createdAt: new Date('2025-10-11T23:16:51.791Z'),
          updatedAt: new Date('2025-10-11T23:16:51.791Z'),
        },
        {
          id: 'cmgmwaayf0007fcv0vdmks1t8',
          bookingId: 'd9d704d1-6d15-4264-9c53-417b08ed1c03',
          amount: 103,
          dueDate: new Date('2025-11-01T00:00:00.000Z'),
          isPaid: false,
          retryCount: 0,
          createdAt: new Date('2025-10-11T23:16:51.791Z'),
          updatedAt: new Date('2025-10-11T23:16:51.791Z'),
        },
      ];

      // Create all test payments
      const createdPayments = await Promise.all(
        testPayments.map((payment) =>
          tx.rentPayment.create({
            data: payment,
          })
        )
      );

      console.log(`✅ Created ${createdPayments.length} test rent payments`);

      return {
        deleted: deleteResult.count,
        created: createdPayments.length,
        payments: createdPayments,
      };
    });

    // Return success response with summary
    return NextResponse.json({
      success: true,
      message: 'Rent payments reset successfully',
      deleted: result.deleted,
      created: result.created,
      payments: result.payments.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        amount: p.amount,
        dueDate: p.dueDate,
        isPaid: p.isPaid,
        hasPaymentMethod: !!p.stripePaymentMethodId,
        retryCount: p.retryCount,
      })),
      testScenarios: {
        overduePayment: {
          id: 'cmgmuub600003fcv0sevtthw9',
          dueDate: '2025-10-12',
          note: 'This payment is overdue - tests how cron handles past-due payments',
        },
        futurePayments: [
          {
            id: 'cmgmuub4q0001fcv0jl1ac35s',
            dueDate: '2025-11-01',
          },
          {
            id: 'cmgmwaayf0007fcv0vdmks1t8',
            dueDate: '2025-11-01',
          },
          {
            id: 'cmgmwaaxa0005fcv0zcgs0k8i',
            dueDate: '2025-12-01',
          },
        ],
        noPaymentMethods: true,
        note: 'All payments have no payment method attached (stripePaymentMethodId = null)',
      },
    });
  } catch (error) {
    console.error('❌ Error resetting rent payments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset rent payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

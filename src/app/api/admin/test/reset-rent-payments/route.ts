import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/stripe';

/**
 * Admin Test Route: Reset Rent Payments
 *
 * WARNING: Only works in development mode
 *
 * Purpose:
 * - Deletes all existing rent payments
 * - Creates a specific set of test rent payments for testing scenarios
 * - Uses logged-in user's bookings or creates sample ones
 *
 * Test Scenarios Created:
 * - Overdue payment (Oct 12, 2025 - in the past) WITH payment method
 * - Current/future payments (Nov 1, Dec 1)
 * - Mix of payments with and without payment methods
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

    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in' },
        { status: 401 }
      );
    }

    // Parse request body to get selected payment method
    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      include: {
        bookings: {
          take: 2,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`💳 Payment method: ${paymentMethodId}`);

    // For testing, attach the payment method to the logged-in admin user
    // This way the admin can test the full payment flow with their own payment method
    if (user.stripeCustomerId) {
      try {
        console.log(`🔗 Attaching payment method ${paymentMethodId} to admin's customer ${user.stripeCustomerId}`);
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: user.stripeCustomerId,
        });
        console.log(`✅ Payment method attached to admin's customer`);
      } catch (attachError: any) {
        // If already attached to another customer, detach and reattach
        if (attachError.code === 'resource_already_attached') {
          console.log(`⚠️ Payment method already attached to another customer, detaching first...`);
          await stripe.paymentMethods.detach(paymentMethodId);
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: user.stripeCustomerId,
          });
          console.log(`✅ Payment method re-attached to admin's customer`);
        } else {
          throw attachError;
        }
      }
    } else {
      console.warn(`⚠️ Admin user has no Stripe customer ID, payment method will not be attached`);
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Delete all existing rent payments
      const deleteResult = await tx.rentPayment.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.count} existing rent payments`);

      // Step 2: Get or use existing bookings
      let bookingIds: string[] = [];

      if (user.bookings.length >= 2) {
        // Use user's existing bookings and ensure they belong to the admin user
        bookingIds = [user.bookings[0].id, user.bookings[1].id];

        // Update bookings to ensure admin is the renter (for testing purposes)
        await tx.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: { userId: user.id }
        });

        console.log(`📦 Using existing bookings (updated to admin): ${bookingIds.join(', ')}`);
      } else if (user.bookings.length === 1) {
        // Use one existing, reference same for second batch
        bookingIds = [user.bookings[0].id, user.bookings[0].id];

        // Update booking to ensure admin is the renter
        await tx.booking.update({
          where: { id: bookingIds[0] },
          data: { userId: user.id }
        });

        console.log(`📦 Using existing booking (updated to admin): ${bookingIds[0]}`);
      } else {
        // User has no bookings - find any booking in the system to reference
        const anyBooking = await tx.booking.findFirst({
          orderBy: { createdAt: 'desc' }
        });

        if (anyBooking) {
          bookingIds = [anyBooking.id, anyBooking.id];

          // Update booking to ensure admin is the renter
          await tx.booking.update({
            where: { id: anyBooking.id },
            data: { userId: user.id }
          });

          console.log(`📦 Using existing system booking (updated to admin): ${anyBooking.id}`);
        } else {
          throw new Error('No bookings found in system. Please create at least one booking first.');
        }
      }

      // Step 3: Create test rent payments matching the SQL structure
      // Use CURRENT YEAR and UTC dates so payments work with "today"
      const now = new Date();
      const currentYear = now.getUTCFullYear();

      // Create dates matching the original SQL but with current year (using UTC to avoid timezone issues)
      const nov1 = new Date(Date.UTC(currentYear, 10, 1, 0, 0, 0, 0)); // Nov 1
      const oct12 = new Date(Date.UTC(currentYear, 9, 12, 0, 0, 0, 0)); // Oct 12
      const dec1 = new Date(Date.UTC(currentYear, 11, 1, 0, 0, 0, 0)); // Dec 1
      const oct11 = new Date(Date.UTC(currentYear, 9, 11, 0, 0, 0, 0)); // Oct 11 (for createdAt)

      const testPayments = [
        {
          id: 'cmgmuub4q0001fcv0jl1ac35s',
          bookingId: bookingIds[0],
          amount: 1648,
          dueDate: nov1, // Nov 1 - FUTURE
          isPaid: false,
          stripePaymentMethodId: paymentMethodId, // Selected payment method
          retryCount: 0,
          createdAt: oct11,
          updatedAt: oct11,
        },
        {
          id: 'cmgmuub600003fcv0sevtthw9',
          bookingId: bookingIds[0],
          amount: 2658,
          dueDate: oct12, // Oct 12 - DUE TODAY (if running on Oct 12)
          isPaid: false,
          stripePaymentMethodId: paymentMethodId, // Selected payment method
          retryCount: 0,
          createdAt: oct11,
          updatedAt: oct11,
        },
        {
          id: 'cmgmwaaxa0005fcv0zcgs0k8i',
          bookingId: bookingIds[1],
          amount: 3,
          dueDate: dec1, // Dec 1 - FUTURE
          isPaid: false,
          stripePaymentMethodId: paymentMethodId, // Selected payment method
          retryCount: 0,
          createdAt: oct11,
          updatedAt: oct11,
        },
        {
          id: 'cmgmwaayf0007fcv0vdmks1t8',
          bookingId: bookingIds[1],
          amount: 103,
          dueDate: nov1, // Nov 1 - FUTURE
          isPaid: false,
          stripePaymentMethodId: paymentMethodId, // Selected payment method
          retryCount: 0,
          createdAt: oct11,
          updatedAt: oct11,
        },
      ];

      console.log(`📅 Test payment dates (current year: ${currentYear}):`);
      console.log(`  - Oct 12: ${oct12.toISOString()}`);
      console.log(`  - Nov 1: ${nov1.toISOString()}`);
      console.log(`  - Dec 1: ${dec1.toISOString()}`);

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
        testDates: { oct12, nov1, dec1 }, // Pass dates for response
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
          dueDate: result.testDates.oct12.toISOString().split('T')[0],
          hasPaymentMethod: true,
          note: 'Due Oct 12 WITH payment method - should be processed if running on Oct 12',
        },
        futurePayments: [
          {
            id: 'cmgmuub4q0001fcv0jl1ac35s',
            dueDate: result.testDates.nov1.toISOString().split('T')[0],
            hasPaymentMethod: true,
            note: 'Due Nov 1 - future payment with payment method',
          },
          {
            id: 'cmgmwaayf0007fcv0vdmks1t8',
            dueDate: result.testDates.nov1.toISOString().split('T')[0],
            hasPaymentMethod: true,
            note: 'Due Nov 1 - future payment with payment method',
          },
          {
            id: 'cmgmwaaxa0005fcv0zcgs0k8i',
            dueDate: result.testDates.dec1.toISOString().split('T')[0],
            hasPaymentMethod: true,
            note: 'Due Dec 1 - future payment with payment method',
          },
        ],
        mixedPaymentMethods: false,
        note: `All 4 payments use payment method: ${paymentMethodId}`,
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


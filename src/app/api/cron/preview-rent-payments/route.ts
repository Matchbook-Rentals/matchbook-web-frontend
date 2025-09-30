import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { sendNotificationEmail } from '@/lib/send-notification-email';

/**
 * CRON JOB: Preview Rent Payments
 *
 * Purpose:
 * This cron job sends a daily preview email to tyler.bennett52@gmail.com showing all
 * rent payments that will be processed the NEXT day. This provides advance visibility
 * into upcoming payment processing and helps with cash flow planning.
 *
 * Business Logic:
 * 1. FIND NEXT DAY PAYMENTS: Identifies rent payments due tomorrow (Pacific time)
 * 2. COMPILE REPORT: Gathers payment details, amounts, and associated booking info
 * 3. CALCULATE TOTALS: Sums up total payments and fees for financial overview
 * 4. EMAIL DELIVERY: Sends formatted HTML report to tyler.bennett52@gmail.com
 *
 * Report Contents:
 * - Count of payments to be processed
 * - Total dollar amount across all payments
 * - Breakdown by payment method type (ACH vs Card)
 * - Individual payment details (renter, host, property, amount)
 * - Fee calculations and net proceeds
 * - Any potential issues (missing payment methods, disabled accounts)
 *
 * Timing:
 * - Runs at 1am Pacific time (same as processing job)
 * - Provides 24-hour advance notice of upcoming payments
 * - Allows time to address any issues before processing
 */

export async function GET(request: Request) {
  // Authorization check using cron secret
  const authHeader = request.headers.get('authorization');
  console.log('Preview rent payments - Received auth header:', authHeader);
  console.log('Preview rent payments - Expected auth header:', `Bearer ${process.env.CRON_SECRET}`);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - preview rent payments');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Generating rent payment preview for tomorrow...');

  try {
    const tomorrowPacific = getTomorrowInPacific();

    // Find all rent payments due tomorrow
    const tomorrowPayments = await findTomorrowPayments(tomorrowPacific);

    console.log(`Cron job: Found ${tomorrowPayments.length} rent payments due tomorrow.`);

    // Generate and send the preview report
    await sendPreviewReport(tomorrowPayments, tomorrowPacific);

    return NextResponse.json({
      success: true,
      previewDate: tomorrowPacific.toISOString(),
      paymentsCount: tomorrowPayments.length,
      message: `Preview report sent for ${tomorrowPayments.length} payments due tomorrow`
    });

  } catch (error) {
    console.error('Cron job: Error generating payment preview:', error);

    // Send error notification to admin
    try {
      await sendErrorNotification(error);
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get tomorrow's date in Pacific timezone
 */
const getTomorrowInPacific = (): Date => {
  const now = new Date();
  // Convert to Pacific time and get tomorrow
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  pacificTime.setDate(pacificTime.getDate() + 1);
  pacificTime.setHours(0, 0, 0, 0);
  return pacificTime;
};

/**
 * Find all rent payments due tomorrow
 */
const findTomorrowPayments = async (tomorrowPacific: Date) => {
  const dayAfterTomorrow = new Date(tomorrowPacific);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  return await prisma.rentPayment.findMany({
    where: {
      dueDate: {
        gte: tomorrowPacific,
        lt: dayAfterTomorrow
      },
      isPaid: false,
      cancelledAt: null,
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              stripeCustomerId: true
            }
          },
          listing: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  stripeAccountId: true,
                  stripeChargesEnabled: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { amount: 'desc' },
      { booking: { listing: { title: 'asc' } } }
    ]
  });
};

/**
 * Generate and send the preview report
 */
const sendPreviewReport = async (payments: any[], previewDate: Date) => {
  const reportData = generateReportData(payments, previewDate);
  const emailContent = generateEmailContent(reportData);

  await sendNotificationEmail({
    to: 'tyler.bennett52@gmail.com',
    subject: `Rent Payment Preview - ${reportData.totalCount} payments due ${previewDate.toLocaleDateString()}`,
    emailData: {
      type: 'payment_preview_report',
      recipientName: 'Tyler',
      reportContent: emailContent,
      previewDate: previewDate.toLocaleDateString(),
      totalCount: reportData.totalCount,
      totalAmount: reportData.totalAmount,
      totalFees: reportData.totalFees,
      totalNetToHosts: reportData.totalNetToHosts,
    },
  });

  console.log('✅ Preview report sent successfully');
};

/**
 * Generate report data from payments
 */
const generateReportData = (payments: any[], previewDate: Date) => {
  let totalAmount = 0;
  let totalFees = 0;
  let cardPayments = 0;
  let achPayments = 0;
  let issuesCount = 0;
  const paymentDetails: any[] = [];
  const issues: string[] = [];

  payments.forEach((payment, index) => {
    const { booking } = payment;
    const renter = booking.user;
    const host = booking.listing.user;

    // Calculate fees (estimates based on payment method)
    const baseAmount = payment.amount;
    let platformFee = 0;
    let paymentMethodType = 'Unknown';

    if (payment.stripePaymentMethodId) {
      // We can't easily determine the payment method type without a Stripe API call
      // For the preview, we'll estimate based on common patterns or default to card fees
      platformFee = baseAmount * 0.03; // Assume 3% for preview (worst case)
      paymentMethodType = 'Card (estimated)';
      cardPayments++;
    } else {
      issues.push(`Payment ${payment.id}: No payment method configured`);
      issuesCount++;
    }

    // Check for host account issues
    if (!host.stripeAccountId) {
      issues.push(`Payment ${payment.id}: Host missing Stripe account`);
      issuesCount++;
    } else if (!host.stripeChargesEnabled) {
      issues.push(`Payment ${payment.id}: Host charges not enabled`);
      issuesCount++;
    }

    totalAmount += baseAmount;
    totalFees += platformFee;

    paymentDetails.push({
      index: index + 1,
      paymentId: payment.id,
      amount: baseAmount,
      platformFee,
      netToHost: baseAmount - platformFee,
      dueDate: payment.dueDate.toLocaleDateString(),
      renterName: `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || renter.email,
      renterEmail: renter.email,
      hostName: `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email,
      hostEmail: host.email,
      propertyTitle: booking.listing.title,
      propertyAddress: `${booking.listing.streetAddress1 || ''}, ${booking.listing.city || ''}, ${booking.listing.state || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
      paymentMethodType,
      bookingId: payment.bookingId,
      hasPaymentMethod: !!payment.stripePaymentMethodId,
      hostAccountReady: !!(host.stripeAccountId && host.stripeChargesEnabled),
      retryCount: payment.retryCount || 0,
    });
  });

  return {
    previewDate,
    totalCount: payments.length,
    totalAmount,
    totalFees,
    totalNetToHosts: totalAmount - totalFees,
    cardPayments,
    achPayments,
    issuesCount,
    paymentDetails,
    issues,
  };
};

/**
 * Generate HTML email content
 */
const generateEmailContent = (data: any) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        🏠 Rent Payment Preview - ${formatDate(data.previewDate)}
      </h1>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #374151; margin-top: 0;">📊 Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${data.totalCount}</div>
            <div style="color: #6b7280;">Total Payments</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${formatCurrency(data.totalAmount)}</div>
            <div style="color: #6b7280;">Total Amount</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${formatCurrency(data.totalFees)}</div>
            <div style="color: #6b7280;">Platform Fees (est.)</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
            <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${formatCurrency(data.totalNetToHosts)}</div>
            <div style="color: #6b7280;">Net to Hosts</div>
          </div>
        </div>
      </div>
  `;

  // Add issues section if there are any
  if (data.issuesCount > 0) {
    html += `
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Issues Requiring Attention (${data.issuesCount})</h2>
        <ul style="color: #991b1b; margin: 0; padding-left: 20px;">
          ${data.issues.map(issue => `<li style="margin: 5px 0;">${issue}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Add payment details table
  html += `
    <div style="margin: 30px 0;">
      <h2 style="color: #374151;">💳 Payment Details</h2>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">#</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Property</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Renter</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Host</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Amount</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Fee</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Net</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
  `;

  data.paymentDetails.forEach((payment: any, index: number) => {
    const statusColor = payment.hasPaymentMethod && payment.hostAccountReady ? '#10b981' : '#dc2626';
    const statusText = payment.hasPaymentMethod && payment.hostAccountReady ? '✅ Ready' : '❌ Issues';
    const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';

    html += `
      <tr style="background: ${rowBg};">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${payment.index}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #111827;">${payment.propertyTitle}</div>
          <div style="font-size: 12px; color: #6b7280;">${payment.propertyAddress}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #111827;">${payment.renterName}</div>
          <div style="font-size: 12px; color: #6b7280;">${payment.renterEmail}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #111827;">${payment.hostName}</div>
          <div style="font-size: 12px; color: #6b7280;">${payment.hostEmail}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #111827;">
          ${formatCurrency(payment.amount)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #f59e0b;">
          ${formatCurrency(payment.platformFee)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #10b981;">
          ${formatCurrency(payment.netToHost)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${statusColor}; font-size: 12px; font-weight: 500;">${statusText}</span>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Add footer with action items
  html += `
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #374151; margin-top: 0;">📋 Next Steps</h3>
      <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
        <li>Review any issues listed above before payment processing</li>
        <li>Payments will be automatically processed at 1:00 AM Pacific tomorrow</li>
        <li>Monitor the admin dashboard for real-time processing status</li>
        <li>Check Stripe Connect accounts for any pending verification</li>
      </ul>
    </div>

    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>This is an automated preview generated by the Matchbook payment system.</p>
      <p>Generated on ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} Pacific Time</p>
    </div>
    </div>
  `;

  return html;
};

/**
 * Send error notification if preview generation fails
 */
const sendErrorNotification = async (error: any) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : '';

  await sendNotificationEmail({
    to: 'tyler.bennett52@gmail.com',
    subject: 'Error: Rent Payment Preview Failed',
    emailData: {
      type: 'system_error',
      recipientName: 'Tyler',
      errorMessage,
      errorStack,
      timestamp: new Date().toISOString(),
      systemComponent: 'Rent Payment Preview Cron Job',
    },
  });
};
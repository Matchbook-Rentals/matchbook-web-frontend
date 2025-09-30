import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const username = process.env.OUTBOUND_EMAIL_USER;
const password = process.env.OUTBOUND_EMAIL_PASS;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: username,
    pass: password
  }
});

/**
 * Sends an invitation email for a specific trip.
 * 
 * @param tripId - The ID of the trip to invite the user to.
 * @param recipientEmail - The email address of the recipient.
 */
export function inviteToTrip(tripId: string, recipientEmail: string) {
  const tripLink = `${process.env.NEXT_PUBLIC_URL}/guest/trips/${tripId}&invited=${recipientEmail}`;

  // Define the email options
  const mailOptions = {
    from: process.env.OUTBOUND_EMAIL_USER,
    to: recipientEmail,
    subject: 'You are Invited to Join a Trip!',
    text: `Hello,

You have been invited to join a trip. Please click the link below to view and accept your invitation:

${tripLink}

Best regards,
Your Travel Team`,
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f0f0f0; padding: 20px; text-align: center; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png" alt="Matchbook Logo" style="max-width: 200px;">
            <h1>Matchbook</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been invited to join a trip. Please click the link below to view and accept your invitation:</p>
            <p><a href="${tripLink}">${tripLink}</a></p>
            <p>Best regards,<br>Your Travel Team</p>
          </div>
        </body>
      </html>
    `
  };

  // Send the email
  transporter.sendMail(mailOptions, (error: any, info: any) => {
    if (error) {
      console.error('Error sending invitation email:', error);
    } else {
      console.log('Invitation email sent:', info.response);
    }
  });
}

/**
 * Sends a payment success notification email (ACH settlement complete).
 * See /docs/payment-spec.md for ACH recovery flow details.
 *
 * @param params - Payment success email parameters
 */
export async function sendPaymentSuccessEmail(params: {
  renterEmail: string;
  renterName: string;
  bookingId: string;
  listingAddress: string;
  amount: number;
}) {
  const mailOptions = {
    from: process.env.OUTBOUND_EMAIL_USER,
    to: params.renterEmail,
    subject: '✅ Payment Confirmed - Your Booking is Complete',
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #0a6060; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .success-icon { color: #10B981; font-size: 48px; }
            .details { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png" alt="Matchbook Logo" style="max-width: 200px;">
            <h1 style="color: white;">Matchbook</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <h2>Payment Confirmed!</h2>
            <p>Hi ${params.renterName},</p>
            <p>Great news! Your payment of <strong>$${params.amount.toFixed(2)}</strong> has successfully cleared.</p>

            <div class="details">
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
              <p><strong>Property:</strong> ${params.listingAddress}</p>
            </div>

            <p>Your booking is now fully confirmed. You'll receive move-in instructions closer to your start date.</p>

            <p>If you have any questions, feel free to contact your host or reach out to our support team.</p>

            <p>Best regards,<br>The Matchbook Team</p>
          </div>
        </body>
      </html>
    `
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.error('Error sending payment success email:', error);
        reject(error);
      } else {
        console.log('Payment success email sent:', info.response);
        resolve(info);
      }
    });
  });
}

/**
 * Sends payment failure notification emails to both renter and host.
 * See /docs/payment-spec.md for ACH recovery flow details.
 *
 * @param params - Payment failure email parameters
 */
export async function sendPaymentFailureEmails(params: {
  renterEmail: string;
  renterName: string;
  hostEmail: string;
  hostName: string;
  matchId: string;
  bookingId: string;
  failureReason: string;
  amount: number;
}) {
  // Email to renter with retry link
  const renterMailOptions = {
    from: process.env.OUTBOUND_EMAIL_USER,
    to: params.renterEmail,
    subject: '⚠️ Payment Failed - Action Required',
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #0a6060; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .warning-icon { color: #EF4444; font-size: 48px; }
            .details { background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
            .cta-button {
              display: inline-block;
              background: #0A6060;
              color: white !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
            }
            .countdown { background-color: #FEF2F2; padding: 10px; border-radius: 4px; color: #EF4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png" alt="Matchbook Logo" style="max-width: 200px;">
            <h1 style="color: white;">Matchbook</h1>
          </div>
          <div class="content">
            <div class="warning-icon">⚠️</div>
            <h2>Payment Issue - Action Needed</h2>
            <p>Hi ${params.renterName},</p>
            <p>Unfortunately, your payment of <strong>$${params.amount.toFixed(2)}</strong> could not be processed.</p>

            <div class="details">
              <p><strong>Reason:</strong> ${params.failureReason}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>

            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Click the button below to retry with a different payment method</li>
              <li>You have <span class="countdown">48 hours</span> to complete payment before your booking is cancelled</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_URL}/app/rent/match/${params.matchId}/retry-payment" class="cta-button">
              Retry Payment Now
            </a>

            <p style="margin-top: 30px;">If you need help, please contact our support team.</p>

            <p>Best regards,<br>The Matchbook Team</p>
          </div>
        </body>
      </html>
    `
  };

  // Email to host (notification only)
  const hostMailOptions = {
    from: process.env.OUTBOUND_EMAIL_USER,
    to: params.hostEmail,
    subject: 'Booking Payment Issue - Renter Notified',
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #0a6060; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .info-box { background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_URL}/logo-nav-new.png" alt="Matchbook Logo" style="max-width: 200px;">
            <h1 style="color: white;">Matchbook</h1>
          </div>
          <div class="content">
            <h2>Payment Issue Notification</h2>
            <p>Hi ${params.hostName},</p>
            <p>We wanted to let you know that the payment for booking <strong>${params.bookingId}</strong> could not be processed.</p>

            <div class="info-box">
              <p><strong>Renter:</strong> ${params.renterName}</p>
              <p><strong>Amount:</strong> $${params.amount.toFixed(2)}</p>
              <p><strong>Reason:</strong> ${params.failureReason}</p>
            </div>

            <p>The renter has been notified and has 48 hours to provide alternative payment. We'll keep you updated on their progress.</p>

            <p>If payment is not received within 48 hours, the booking will be automatically cancelled and the dates will be made available again.</p>

            <p>Best regards,<br>The Matchbook Team</p>
          </div>
        </body>
      </html>
    `
  };

  // Send both emails
  const renterPromise = new Promise((resolve, reject) => {
    transporter.sendMail(renterMailOptions, (error: any, info: any) => {
      if (error) {
        console.error('Error sending payment failure email to renter:', error);
        reject(error);
      } else {
        console.log('Payment failure email sent to renter:', info.response);
        resolve(info);
      }
    });
  });

  const hostPromise = new Promise((resolve, reject) => {
    transporter.sendMail(hostMailOptions, (error: any, info: any) => {
      if (error) {
        console.error('Error sending payment notification email to host:', error);
        reject(error);
      } else {
        console.log('Payment notification email sent to host:', info.response);
        resolve(info);
      }
    });
  });

  return Promise.all([renterPromise, hostPromise]);
}

/**
 * Get human-readable failure reason from Stripe error code.
 * See /docs/payment-spec.md for complete error code list.
 *
 * @param code - Stripe error code
 * @returns Human-readable failure reason
 */
export function getHumanReadableFailureReason(code: string): string {
  const reasons: Record<string, string> = {
    'R01': 'Insufficient funds in bank account',
    'R02': 'Bank account is closed or invalid',
    'R07': 'Payment authorization was revoked',
    'R10': 'Customer advised unauthorized transaction',
    'R29': 'Corporate customer advises not authorized',
    'insufficient_funds': 'Insufficient funds in your account',
    'account_closed': 'Bank account is closed',
    'authorization_revoked': 'Payment authorization was revoked',
    'debit_not_authorized': 'Debit transaction not authorized',
    'card_declined': 'Your card was declined',
    'expired_card': 'Your card has expired',
    'incorrect_cvc': 'Incorrect security code',
    'processing_error': 'A processing error occurred',
    'unknown': 'Bank declined the payment',
  };

  return reasons[code] || 'Bank declined the payment';
}
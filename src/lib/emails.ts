import nodemailer from 'nodemailer';

// Create a transporter using SMTP
// TODO: Move to outlook, then move to either smtp server or resend
const username = process.env.EMAIL_USER;
const password = process.env.EMAIL_PASS;
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
 * @param outboundEmail - The email address of the recipient.
 */
export function inviteToTrip(tripId: string, outboundEmail: string) {
  const tripLink = `${process.env.NEXT_PUBLIC_URL}/guest/trips/${tripId}&invited=${outboundEmail}`;

  // Define the email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: outboundEmail,
    subject: 'You are Invited to Join a Trip!',
    text: `Hello,

You have been invited to join a trip. Please click the link below to view and accept your invitation:

${tripLink}

Best regards,
Your Travel Team`
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
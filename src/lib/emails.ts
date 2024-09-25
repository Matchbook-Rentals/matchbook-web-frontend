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
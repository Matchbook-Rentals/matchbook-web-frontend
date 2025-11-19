import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/send-notification-email';
import { generateEmailTemplateHtml } from '@/lib/email-template-html';

const baseUrl = process.env.NEXT_PUBLIC_URL;

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, tripId } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required.' },
        { status: 400 }
      );
    }

    console.log('Inviting user to trip', tripId, recipientEmail);

    const tripLink = `${baseUrl}/guest/trips/${tripId}&invited=${recipientEmail}`;

    // Create email data using the standard template format
    const emailData = {
      companyName: 'MATCHBOOK',
      headerText: 'You are Invited to Join a Trip!',
      contentTitle: '',
      contentText: 'Hello,\n\nYou have been invited to join a trip. Please click the link below to view and accept your invitation.',
      buttonText: 'View Trip Invitation',
      buttonUrl: tripLink,
      companyAddress: '123 Main Street',
      companyCity: 'San Francisco, CA 94105',
      companyWebsite: 'matchbookrentals.com',
      footerText: 'Best regards, Your Travel Team'
    };

    // Send via the queue system
    const result = await sendNotificationEmail({
      to: recipientEmail,
      subject: 'You are Invited to Join a Trip!',
      emailData: emailData,
    });

    if (!result.success) {
      console.error('Error sending invitation email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send invitation.' },
        { status: 500 }
      );
    }

    console.log(`Trip invitation sent successfully (emailId: ${result.emailId})`);
    return NextResponse.json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/send-notification-email';

const baseUrl = process.env.NEXT_PUBLIC_URL;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to extract tripId
    const { tripId, recipientEmail } = await req.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required.' },
        { status: 400 }
      );
    }

    const tripLink = `${baseUrl}/trips/${tripId}`;

    // Create email data using the standard template format
    const emailData = {
      companyName: 'MATCHBOOK',
      headerText: 'An exciting new trip',
      contentTitle: '',
      contentText: 'Hello,\n\nYou have been invited to join a trip. Please click the link below to view and accept your invitation.',
      buttonText: 'View Trip',
      buttonUrl: tripLink,
      companyAddress: '123 Main Street',
      companyCity: 'San Francisco, CA 94105',
      companyWebsite: 'matchbookrentals.com',
      footerText: 'Best regards, Your Travel Team'
    };

    // Send via the queue system
    const result = await sendNotificationEmail({
      to: recipientEmail,
      subject: 'An exciting new trip',
      emailData: emailData,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return data in the same format as before for backward compatibility
    return NextResponse.json({ id: result.emailId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

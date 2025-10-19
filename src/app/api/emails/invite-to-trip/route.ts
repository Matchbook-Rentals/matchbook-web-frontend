import { Resend } from 'resend';
import JoinTripEmailTemplate from '@/components/email-templates/join-trip';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
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

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'MatchBook Rentals <no-reply@matchbookrentals.com>',
      to: [recipientEmail],
      subject: 'You are Invited to Join a Trip!',
      react: JoinTripEmailTemplate({ tripLink: `${baseUrl}/guest/trips/${tripId}&invited=${recipientEmail}` }),
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return NextResponse.json(
        { error: 'Failed to send invitation.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation.' },
      { status: 500 }
    );
  }
}

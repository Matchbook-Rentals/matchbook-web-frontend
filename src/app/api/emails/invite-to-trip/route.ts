import { NextRequest, NextResponse } from 'next/server';
import { inviteToTrip } from '@/lib/emails';

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
    console.log('EMAIL_USER', process.env.EMAIL_USER);
    console.log('EMAIL_PASS', process.env.EMAIL_PASS);
    inviteToTrip(tripId, recipientEmail);

    return NextResponse.json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation.' },
      { status: 500 }
    );
  }
}

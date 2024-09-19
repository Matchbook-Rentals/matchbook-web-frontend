import { NextRequest, NextResponse } from 'next/server';
import { inviteToTrip } from '@/lib/emails';

export async function POST(request: NextRequest) {
  try {
    const { outboundEmail, tripId } = await request.json();

    if (!outboundEmail) {
      return NextResponse.json(
        { error: 'Outbound email is required.' },
        { status: 400 }
      );
    }


    console.log('Inviting user to trip', tripId, outboundEmail);
    console.log('EMAIL_USER', process.env.EMAIL_USER);
    console.log('EMAIL_PASS', process.env.EMAIL_PASS);
    inviteToTrip(tripId, outboundEmail);

    return NextResponse.json({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation.' },
      { status: 500 }
    );
  }
}

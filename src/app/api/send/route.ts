import { Resend } from 'resend';
import JoinTripEmailTemplate from '@/components/email-templates/join-trip';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_URL;

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to extract tripId
    const { tripId, recipientEmail } = await req.json();

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'no-reply <info@matchbookrentals.com>',
      to: [recipientEmail],
      subject: 'An exciting new trip',
      react: JoinTripEmailTemplate({ tripLink: `${baseUrl}/trips/${tripId}` }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

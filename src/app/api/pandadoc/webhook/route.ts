
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract signature from query parameters
    const url = new URL(req.url);
    const signature = url.searchParams.get('signature');
    const sharedKey = process.env.PANDADOC_WEBHOOK_KEY;

    if (!sharedKey) {
      console.error('PANDADOC_WEBHOOK_KEY not found in environment variables');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
    }

    // Finish the webhook signature verification
    const hmac = crypto.createHmac('sha256', sharedKey);
    const requestBody = JSON.stringify(body);
    hmac.update(requestBody);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // Handle different webhook events
    switch (body.event) {
      case 'document_deleted':
        // Handle document deleted event
        break;
      case 'recipient_completed':
        // Handle recipient completed event
        break;
      case 'document_updated':
        // Handle document updated event
        break;
      case 'document_state_changed':
        // Handle document state changed event
        break;
      case 'document_creation_failed':
        // Handle document creation failed event
        break;
      case 'document_completed_pdf_ready':
        // Handle document completed and PDF ready event
        break;
      case 'document_section_added':
        // Handle document section added event
        break;
      case 'quote_updated':
        // Handle quote updated event
        break;
      case 'template_created':
        // Handle template created event
        break;
      case 'template_updated':
        // Handle template updated event
        break;
      case 'template_deleted':
        // Handle template deleted event
        break;
      default:
        // Handle unknown event
        return NextResponse.json({ message: 'Unknown event' }, { status: 400 });
    }

    // Process the webhook data here
    console.log(body.event);

    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

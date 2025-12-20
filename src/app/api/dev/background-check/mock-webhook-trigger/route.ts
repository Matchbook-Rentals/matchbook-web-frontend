import { NextResponse } from "next/server";
import { getMockXml } from "@/lib/accio/mock-data";
import { MOCK_CONFIG, type MockSubject } from "@/lib/accio/config";

/**
 * DEV ONLY - Manually trigger mock webhook
 *
 * Use this when MOCK_AUTO_WEBHOOK=false to test slow flow scenarios.
 * POST with { orderId: "MOCK-xxx", subject?: "blackwood_dante" }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, subject = MOCK_CONFIG.defaultSubject } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    console.log(`[Mock Webhook Trigger] Manually triggering webhook for order ${orderId}`);
    console.log(`[Mock Webhook Trigger] Subject: ${subject}`);

    const mockXml = getMockXml(subject as MockSubject, orderId);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/background-check-webhook`;

    // Create auth header (use mock credentials if real ones not available)
    const username = process.env.ACCIO_USERNAME || 'mock-user';
    const password = process.env.ACCIO_PASSWORD || 'mock-pass';
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': authHeader,
        'X-Mock-Webhook': 'true',
      },
      body: mockXml,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[Mock Webhook Trigger] Webhook failed:`, responseText);
      return NextResponse.json({
        success: false,
        error: 'Webhook call failed',
        status: response.status,
        details: responseText,
      }, { status: 500 });
    }

    console.log(`[Mock Webhook Trigger] Webhook succeeded`);

    return NextResponse.json({
      success: true,
      orderId,
      subject,
      message: 'Mock webhook triggered successfully',
    });
  } catch (error) {
    console.error('[Mock Webhook Trigger] Error:', error);
    return NextResponse.json({
      error: 'Failed to trigger webhook',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'POST to this endpoint to manually trigger mock webhook',
    usage: {
      method: 'POST',
      body: {
        orderId: 'MOCK-xxx (required)',
        subject: 'blackwood_dante (optional, default)',
      },
    },
    note: 'Use when MOCK_AUTO_WEBHOOK=false to test slow flow scenarios',
  });
}

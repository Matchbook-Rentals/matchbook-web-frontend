import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  console.log('🔔 [Hospitable Webhook] Received webhook request');

  const signature = request.headers.get("x-hospitable-signature");
  const body = await request.text();

  console.log('📋 Request headers:', {
    signature: signature ? `${signature.substring(0, 20)}...` : 'MISSING',
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length')
  });

  if (!signature) {
    console.error('❌ [Hospitable Webhook] Signature missing');
    return new Response("Signature missing", { status: 400 });
  }

  // Verify the webhook signature for security
  console.log('🔐 [Hospitable Webhook] Verifying signature...');
  const secret = process.env.HOSPITABLE_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  if (signature !== expectedSignature) {
    console.error('❌ [Hospitable Webhook] Invalid signature');
    console.error('   Received:', signature);
    console.error('   Expected:', expectedSignature);
    return new Response("Invalid signature", { status: 401 });
  }

  console.log('✅ [Hospitable Webhook] Signature verified');

  const event = JSON.parse(body);

  console.log('📦 [Hospitable Webhook] Event payload:', JSON.stringify(event, null, 2).substring(0, 1000));
  console.log('🏷️ [Hospitable Webhook] Event type:', event.type);

  // Process the event based on its type
  switch (event.type) {
    case "booking.created":
      console.log("📅 [Hospitable Webhook] Processing booking.created event");
      console.log("   Booking data:", JSON.stringify(event.data, null, 2));
      // TODO: Implement logic to create a booking in your database
      console.log("⚠️ [Hospitable Webhook] TODO: Implement booking creation logic");
      break;
    case "booking.updated":
      console.log("🔄 [Hospitable Webhook] Processing booking.updated event");
      console.log("   Booking data:", JSON.stringify(event.data, null, 2));
      // TODO: Implement logic to update a booking in your database
      console.log("⚠️ [Hospitable Webhook] TODO: Implement booking update logic");
      break;
    case "booking.cancelled":
      console.log("❌ [Hospitable Webhook] Processing booking.cancelled event");
      console.log("   Booking data:", JSON.stringify(event.data, null, 2));
      // TODO: Implement logic to cancel a booking in your database
      console.log("⚠️ [Hospitable Webhook] TODO: Implement booking cancellation logic");
      break;
    default:
      console.log("⚠️ [Hospitable Webhook] Unhandled event type:", event.type);
      console.log("   Event data:", JSON.stringify(event.data, null, 2));
  }

  const processingTime = Date.now() - startTime;
  console.log('✅ [Hospitable Webhook] Webhook processed successfully');
  console.log('⏱️ [Hospitable Webhook] Processing time:', processingTime, 'ms');

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

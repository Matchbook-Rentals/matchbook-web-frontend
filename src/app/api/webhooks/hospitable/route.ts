import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hospitable-signature");
  const body = await request.text();

  if (!signature) {
    return new Response("Signature missing", { status: 400 });
  }

  // Verify the webhook signature for security
  const secret = process.env.HOSPITABLE_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Process the event based on its type
  switch (event.type) {
    case "booking.created":
      // TODO: Implement logic to create a booking in your database
      console.log("Booking created:", event.data);
      break;
    case "booking.updated":
      // TODO: Implement logic to update a booking in your database
      console.log("Booking updated:", event.data);
      break;
    case "booking.cancelled":
      // TODO: Implement logic to cancel a booking in your database
      console.log("Booking cancelled:", event.data);
      break;
    default:
      console.log("Unhandled Hospitable event type:", event.type);
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

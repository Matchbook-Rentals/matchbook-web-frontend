import { triggerMockWebhook, createMockOrderResponse } from "@/lib/accio";

/**
 * Mock Accio Background Check Endpoint
 *
 * Logs the XML request, triggers a mock webhook, and returns a mock order response.
 * Returns the same response format as the real Accio API.
 */
export async function POST(request: Request) {
  const xmlBody = await request.text();

  // Extract order number from XML if present, otherwise generate one
  const orderMatch = xmlBody.match(/<order_number>(.*?)<\/order_number>/);
  const orderNumber = orderMatch?.[1] || `MOCK-${Date.now()}`;

  console.log("\n" + "=".repeat(60));
  console.log("🎭 [MOCK Accio] Background Check Request");
  console.log("=".repeat(60));
  console.log("📋 Order Number:", orderNumber);
  console.log("📄 [INCOMING] XML Payload:");
  console.log(xmlBody);
  console.log("=".repeat(60));

  // Schedule mock webhook trigger (non-blocking, fires after ~2 seconds)
  triggerMockWebhook(orderNumber);
  console.log("🎭 [MOCK Accio] Webhook scheduled to fire in ~2 seconds");

  // Return mock XML response (same format as real Accio)
  const responseXml = createMockOrderResponse(orderNumber);

  console.log("🎭 [MOCK Accio] Returning order response:");
  console.log(responseXml);

  return new Response(responseXml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

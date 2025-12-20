/**
 * Accio Mock Service
 *
 * Handles mock background check submissions by:
 * 1. Returning a mock order response immediately
 * 2. Self-triggering the webhook endpoint with mock XML data
 * 3. Providing mock PDF data for eviction parsing
 */

import { getMockXml } from './mock-data';
import { MOCK_CONFIG, type MockSubject } from './config';

/**
 * Trigger a mock webhook call to our own endpoint
 * This simulates Accio calling back with results
 */
export const triggerMockWebhook = (
  orderId: string,
  subject: MockSubject = MOCK_CONFIG.defaultSubject
): void => {
  // Check if auto-trigger is disabled (for testing slow flows)
  if (!MOCK_CONFIG.autoTriggerWebhook) {
    console.log(`[Accio Mock] Auto-trigger disabled. Order ${orderId} will remain in PROCESSING_BGS status.`);
    console.log(`[Accio Mock] To trigger manually: POST /api/dev/background-check/mock-webhook-trigger with { "orderId": "${orderId}" }`);
    return;
  }

  // Non-blocking: schedule webhook trigger
  setTimeout(async () => {
    try {
      const mockXml = getMockXml(subject, orderId);
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/background-check-webhook`;

      console.log(`[Accio Mock] Triggering webhook for order ${orderId}`);
      console.log(`[Accio Mock] Subject: ${subject}`);
      console.log(`[Accio Mock] Webhook URL: ${webhookUrl}`);

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
      console.log(`[Accio Mock] Webhook response status: ${response.status}`);

      if (!response.ok) {
        console.error(`[Accio Mock] Webhook failed:`, responseText);
      } else {
        console.log(`[Accio Mock] Webhook succeeded`);
      }
    } catch (error) {
      console.error('[Accio Mock] Failed to trigger webhook:', error);
    }
  }, MOCK_CONFIG.webhookDelayMs);
};

/**
 * Create a mock order response XML
 * This mimics what Accio returns when an order is placed
 */
export const createMockOrderResponse = (orderNumber: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order orderID="${orderNumber}" number="${orderNumber}">
    <subOrder type="National Criminal" suborderID="MOCK-NC-${Date.now()}"/>
    <subOrder type="evictions_check" suborderID="MOCK-EV-${Date.now()}"/>
  </order>
</XML>`;
};

/**
 * Check if an order ID is a mock order
 */
export const isMockOrderId = (orderId: string): boolean => {
  return orderId.startsWith('MOCK-');
};

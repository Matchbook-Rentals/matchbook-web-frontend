/**
 * Background Check (Accio) - Extracted business logic
 *
 * This module handles the Accio background check flow.
 * Used by:
 * - /api/verification/run (orchestrator)
 * - /api/background-check (standalone for testing)
 */

import prisma from "@/lib/prismadb";
import {
  generateRequestId,
  getSecurityContext,
} from "@/lib/audit-logger";
import {
  shouldUseMock,
  getAccioEnvironment,
  triggerMockWebhook,
  createMockOrderResponse,
} from "@/lib/accio";
import { getAccioUrl } from "@/lib/verification/config";
import { generateVerificationXml } from "@/app/app/rent/verification/utils";

// Accio API credentials
const ACCOUNT_DETAILS = {
  account: process.env.ACCIO_ACCOUNT,
  username: process.env.ACCIO_USERNAME,
  password: process.env.ACCIO_PASSWORD,
};

export interface BackgroundCheckParams {
  userId: string;
  verificationId: string;
  purchaseId: string;
  firstName: string;
  lastName: string;
  ssn: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  creditCheckConsentAt?: string;
  backgroundCheckConsentAt?: string;
}

export interface BackgroundCheckResult {
  success: boolean;
  errorType?: "API_ERROR" | "VALIDATION_ERROR";
  message?: string;
  orderNumber?: string;
  responseDetails?: string;
}

/**
 * Run Accio background check and update verification record
 */
export async function runBackgroundCheck(params: BackgroundCheckParams): Promise<BackgroundCheckResult> {
  const {
    userId,
    verificationId,
    purchaseId,
    firstName,
    lastName,
    ssn,
    dob,
    address,
    city,
    state,
    zip,
    creditCheckConsentAt,
    backgroundCheckConsentAt,
  } = params;

  const requestId = generateRequestId();
  const startTime = Date.now();

  // Build form data for XML generation
  const formData = {
    firstName,
    lastName,
    ssn,
    dob,
    address,
    city,
    state,
    zip,
    creditAuthorizationAcknowledgment: true,
    backgroundCheckAuthorization: true,
  };

  // Generate XML for the combined check
  const xmlPayload = generateVerificationXml(formData, ACCOUNT_DETAILS);

  // Determine if we should use mock mode
  const useMock = shouldUseMock();
  const accioEnv = getAccioEnvironment();

  // Always log request
  console.log("\n" + "=".repeat(80));
  console.log("BACKGROUND_CHECK_REQUEST_START");
  console.log("=".repeat(80));
  console.log("🔧 Environment:", accioEnv);
  console.log("🔧 Mock Mode:", useMock);
  console.log("📋 Verification ID:", verificationId);
  console.log(xmlPayload);
  console.log("=".repeat(80));
  console.log("BACKGROUND_CHECK_REQUEST_END");
  console.log("=".repeat(80) + "\n");

  let responseText: string;
  let orderNumber: string;

  try {
    if (useMock) {
      console.log(`🎭 MOCK MODE (${accioEnv}): Returning simulated Accio response`);

      // Generate mock order number
      orderNumber = "MOCK-" + Date.now();

      // Create mock response XML
      responseText = createMockOrderResponse(orderNumber);

      // Schedule mock webhook trigger (non-blocking)
      triggerMockWebhook(orderNumber);

      console.log("\n" + "=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_START (MOCK)");
      console.log("=".repeat(80));
      console.log(responseText);
      console.log("=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_END");
      console.log("=".repeat(80) + "\n");
    } else {
      // Send XML to Accio Data API
      const accioResponse = await fetch(getAccioUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: xmlPayload,
      });

      // Get response text regardless of status code
      responseText = await accioResponse.text();

      // Always log response
      console.log("\n" + "=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_START");
      console.log("=".repeat(80));
      console.log("Status:", accioResponse.status, accioResponse.statusText);
      console.log(responseText);
      console.log("=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_END");
      console.log("=".repeat(80) + "\n");

      // Check for XML error nodes in the response
      if (responseText.includes("<error") || !accioResponse.ok) {
        console.error("Error from Accio API:", responseText);

        // Try to extract error message from XML
        let errorMessage = "Unknown error occurred";
        try {
          const errorMatch = responseText.match(/<errortext>(.*?)<\/errortext>/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1];
          }
        } catch (err) {
          console.warn("Could not parse error from response", err);
        }

        return {
          success: false,
          errorType: "API_ERROR",
          message: errorMessage,
          responseDetails: responseText,
        };
      }

      // Extract order number if available
      orderNumber = "BC-" + Math.floor(Math.random() * 10000000);
      try {
        const orderMatch = responseText.match(/<order_number>(.*?)<\/order_number>/);
        if (orderMatch && orderMatch[1]) {
          orderNumber = orderMatch[1];
        }
      } catch (err) {
        console.warn("Could not parse order number from response", err);
      }
    }

    // Update the purchase with the orderId and mark as redeemed
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        orderId: orderNumber,
        isRedeemed: true,
        status: "completed",
      },
    });

    // Create BGSReport entry for tracking
    const bgsReport = await prisma.bGSReport.create({
      data: {
        purchaseId,
        userId,
        orderId: orderNumber,
        status: "pending",
      },
    });

    // Get security context for audit logging
    const securityContext = await getSecurityContext();
    const responseTimeMs = Date.now() - startTime;

    // Update verification with BGS data
    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: "PROCESSING_BGS",
        bgsReportId: bgsReport.id,
        backgroundCheckConsentAt: backgroundCheckConsentAt ? new Date(backgroundCheckConsentAt) : undefined,
        creditCheckConsentAt: creditCheckConsentAt ? new Date(creditCheckConsentAt) : undefined,
        backgroundCheckRequestedAt: new Date(startTime),
        backgroundCheckRequestId: orderNumber,
        backgroundCheckedAt: new Date(),
        permissiblePurpose: "rental_screening",
        consentIpAddress: securityContext.ipAddress,
        consentUserAgent: securityContext.userAgent,
        consentCity: securityContext.city,
        consentRegion: securityContext.region,
        consentCountry: securityContext.country,
      },
    });

    console.log(`✅ Background check order ${orderNumber} saved for purchase ${purchaseId}`);

    return {
      success: true,
      orderNumber,
      responseDetails: responseText,
    };
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("BACKGROUND_CHECK_ERROR_START");
    console.error("=".repeat(80));
    console.error("Error processing background check request:", error);
    console.error("=".repeat(80));
    console.error("BACKGROUND_CHECK_ERROR_END");
    console.error("=".repeat(80) + "\n");

    return {
      success: false,
      errorType: "API_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

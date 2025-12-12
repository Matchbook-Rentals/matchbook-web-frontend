import { NextResponse } from "next/server";
import { z } from "zod";
import {
  verificationSchema,
  generateVerificationXml
} from "@/app/app/rent/verification/utils";
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import {
  generateRequestId,
  getSecurityContext,
  maskSSN,
} from "@/lib/audit-logger";

// SAFETY: Set to true to prevent API calls during development
// NOTE: ACCIO_* env vars are commented out in .env to ensure we don't accidentally call the real API
const MOCK_MODE = false;

// Use the provided test credentials
const ACCOUNT_DETAILS = {
  account: process.env.ACCIO_ACCOUNT,
  username: process.env.ACCIO_USERNAME,
  password: process.env.ACCIO_PASSWORD
};

// API endpoint to handle background check requests
export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth();

    // Check for test mode header
    const testUserId = request.headers.get('x-test-user-id');
    const effectiveUserId = testUserId || userId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Extract consent timestamps for audit
    const {
      creditCheckConsentAt,
      backgroundCheckConsentAt,
      ...formData
    } = body;

    // Generate request ID and capture start time for audit
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Validate request data
    const parseResult = verificationSchema.safeParse(formData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check if user has an unredeemed background check purchase
    // Accept both 'backgroundCheck' (test page) and 'matchbookVerification' (verification flow)
    const unredeemedPurchase = await prisma.purchase.findFirst({
      where: {
        userId: effectiveUserId,
        type: { in: ['backgroundCheck', 'matchbookVerification'] },
        isRedeemed: false,
      },
    });

    if (!unredeemedPurchase) {
      return NextResponse.json(
        { error: "No unredeemed background check purchase found" },
        { status: 403 }
      );
    }

    // Generate XML for the combined check
    const xmlPayload = generateVerificationXml(data, ACCOUNT_DETAILS);

    // Always log request - search for BACKGROUND_CHECK_REQUEST in logs
    console.log("\n" + "=".repeat(80));
    console.log("BACKGROUND_CHECK_REQUEST_START");
    console.log("=".repeat(80));
    console.log("🔧 MOCK_MODE:", MOCK_MODE);
    console.log(xmlPayload);
    console.log("=".repeat(80));
    console.log("BACKGROUND_CHECK_REQUEST_END");
    console.log("=".repeat(80) + "\n");

    let responseText: string;
    let orderNumber: string;

    if (MOCK_MODE) {
      console.log("🎭 MOCK MODE: Returning simulated Accio response");

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock order number
      orderNumber = "MOCK-" + Math.floor(Math.random() * 10000000);

      // Mock successful response XML
      responseText = `<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <order_number>${orderNumber}</order_number>
  <status>pending</status>
  <message>Order placed successfully (MOCK)</message>
</XML>`;

      console.log("\n" + "=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_START (MOCK)");
      console.log("=".repeat(80));
      console.log(responseText);
      console.log("=".repeat(80));
      console.log("BACKGROUND_CHECK_RESPONSE_END");
      console.log("=".repeat(80) + "\n");
    } else {
      // Send XML to Accio Data API
      const accioResponse = await fetch("https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml", {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: xmlPayload,
      });

      // Get response text regardless of status code
      responseText = await accioResponse.text();

      // Always log response - search for BACKGROUND_CHECK_RESPONSE in logs
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

        return NextResponse.json(
          {
            error: errorMessage,
            details: responseText
          },
          { status: 400 }
        );
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
      where: {
        id: unredeemedPurchase.id,
      },
      data: {
        orderId: orderNumber,
        isRedeemed: true,
        status: "completed",
      },
    });
    
    // Create BGSReport entry for tracking
    await prisma.bGSReport.create({
      data: {
        purchaseId: unredeemedPurchase?.id,
        userId: effectiveUserId,
        orderId: orderNumber,
        status: 'pending'
      }
    });

    // Get security context for audit logging
    const securityContext = await getSecurityContext();
    const responseTimeMs = Date.now() - startTime;

    // Update Verification with audit data
    await prisma.verification.upsert({
      where: { userId: effectiveUserId },
      update: {
        // Consent timestamps (only set if provided)
        backgroundCheckConsentAt: backgroundCheckConsentAt ? new Date(backgroundCheckConsentAt) : undefined,
        creditCheckConsentAt: creditCheckConsentAt ? new Date(creditCheckConsentAt) : undefined,
        // API tracking
        backgroundCheckRequestedAt: new Date(startTime),
        backgroundCheckRequestId: orderNumber, // Use order number as request ID
        permissiblePurpose: "rental_screening",
        // Security context
        consentIpAddress: securityContext.ipAddress,
        consentUserAgent: securityContext.userAgent,
        consentCity: securityContext.city,
        consentRegion: securityContext.region,
        consentCountry: securityContext.country,
      },
      create: {
        userId: effectiveUserId,
        backgroundCheckConsentAt: backgroundCheckConsentAt ? new Date(backgroundCheckConsentAt) : undefined,
        creditCheckConsentAt: creditCheckConsentAt ? new Date(creditCheckConsentAt) : undefined,
        backgroundCheckRequestedAt: new Date(startTime),
        backgroundCheckRequestId: orderNumber,
        permissiblePurpose: "rental_screening",
        consentIpAddress: securityContext.ipAddress,
        consentUserAgent: securityContext.userAgent,
        consentCity: securityContext.city,
        consentRegion: securityContext.region,
        consentCountry: securityContext.country,
      },
    });

    console.log(`Background check order ${orderNumber} saved for purchase ${unredeemedPurchase.id}`);
    
    return NextResponse.json({
      success: true,
      message: "Background check request submitted successfully",
      orderNumber,
      responseDetails: responseText
    });
    
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("BACKGROUND_CHECK_ERROR_START");
    console.error("=".repeat(80));
    console.error("Error processing background check request:", error);
    console.error("=".repeat(80));
    console.error("BACKGROUND_CHECK_ERROR_END");
    console.error("=".repeat(80) + "\n");

    return NextResponse.json(
      {
        error: "Failed to process background check request",
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { 
  verificationSchema,
  generateVerificationXml
} from "@/app/app/verification/utils";
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// Use the provided test credentials
const ACCOUNT_DETAILS = {
  account: process.env.ACCIO_ACCOUNT,
  username: process.env.ACCIO_USERNAME,
  password: process.env.ACCIO_PASSWORD
};

// For debugging - log requests and responses fully
const DEBUG = true; // Set to false in production

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
    
    // Validate request data
    const parseResult = verificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    
    const data = parseResult.data;
    
    // Check if user has an unredeemed background check purchase
    const unredeemedPurchase = await prisma.purchase.findFirst({
      where: {
        userId: effectiveUserId,
        type: 'backgroundCheck',
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
    
    if (DEBUG) {
      console.log("=== XML REQUEST PAYLOAD ===");
      console.log(xmlPayload);
      console.log("==========================");
    }
    
    // Send XML to Accio Data API for testing
    const accioResponse = await fetch("https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml", // Fixed Content-Type as required by API
      },
      body: xmlPayload,
    });
    
    // Get response text regardless of status code
    const responseText = await accioResponse.text();
    
    if (DEBUG) {
      console.log("=== ACCIO API RESPONSE ===");
      console.log("Status:", accioResponse.status, accioResponse.statusText);
      console.log("Response Text:", responseText);
      console.log("=========================");
    }
    
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
    
    // Extract order number if available (this would be implementation-specific)
    let orderNumber = "BC-" + Math.floor(Math.random() * 10000000);
    try {
      // Try to extract order number from XML response (example pattern, adjust according to actual response)
      const orderMatch = responseText.match(/<order_number>(.*?)<\/order_number>/);
      if (orderMatch && orderMatch[1]) {
        orderNumber = orderMatch[1];
      }
    } catch (err) {
      console.warn("Could not parse order number from response", err);
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
    
    console.log(`Background check order ${orderNumber} saved for purchase ${unredeemedPurchase.id}`);
    
    return NextResponse.json({
      success: true,
      message: "Background check request submitted successfully",
      orderNumber,
      responseDetails: responseText
    });
    
  } catch (error) {
    if (DEBUG) {
      console.error("=== API ERROR ===");
      console.error("Error processing background check request:", error);
      console.error("==================");
    }
    
    // Provide more details in development mode
    return NextResponse.json(
      { 
        error: "Failed to process background check request", 
        details: DEBUG ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

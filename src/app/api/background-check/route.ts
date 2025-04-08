import { NextResponse } from "next/server";
import { z } from "zod";
import { 
  verificationSchema,
  generateVerificationXml
} from "@/app/platform/verification/utils";

// Use the provided test credentials
const ACCOUNT_DETAILS = {
  account: "matchbook",
  username: "Tyler.Bennett@matchbookrentals.com",
  password: "TylerBennet13#!"
};

// API endpoint to handle background check requests
export async function POST(request: Request) {
  try {
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
    
    // Generate XML for the combined check
    const xmlPayload = generateVerificationXml(data, ACCOUNT_DETAILS);
    
    console.log("XML Payload:", xmlPayload);
    
    // Send XML to Accio Data API for testing
    const accioResponse = await fetch("https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml", {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
      },
      body: xmlPayload,
    });
    
    // Check if the request was successful
    if (!accioResponse.ok) {
      const errorText = await accioResponse.text();
      console.error("Error from Accio API:", errorText);
      throw new Error(`API returned ${accioResponse.status}: ${errorText}`);
    }
    
    // Parse the response from Accio
    const responseText = await accioResponse.text();
    console.log("Accio API Response:", responseText);
    
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
    
    return NextResponse.json({
      success: true,
      message: "Background check request submitted successfully",
      orderNumber,
      responseDetails: responseText
    });
    
  } catch (error) {
    console.error("Error processing background check request:", error);
    return NextResponse.json(
      { error: "Failed to process background check request" },
      { status: 500 }
    );
  }
}
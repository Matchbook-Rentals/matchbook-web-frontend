/**
 * Credit Check (iSoftPull) - Extracted business logic
 *
 * This module handles the iSoftPull credit check flow.
 * Used by:
 * - /api/verification/run (orchestrator)
 * - /api/verification/isoftpull (standalone for testing)
 */

import { writeFile } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prismadb";
import {
  generateRequestId,
  getSecurityContext,
  logApiResponse,
  maskSSN,
} from "@/lib/audit-logger";
import { getISoftPullUrl, hasISoftPullKeys } from "@/lib/verification/config";

// iSoftPull requires full state names, not abbreviations
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

export interface CreditCheckParams {
  userId: string;
  verificationId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  creditCheckConsentAt?: string;
  backgroundCheckConsentAt?: string;
}

export interface CreditCheckResult {
  success: boolean;
  errorType?: "INVALID_SSN" | "NO_CREDIT_FILE" | "API_ERROR" | "CREDENTIALS_NOT_CONFIGURED";
  message?: string;
  creditBucket?: string;
  creditData?: any;
  reportUrl?: string;
}

/**
 * Run iSoftPull credit check and update verification record
 */
export async function runCreditCheck(params: CreditCheckParams): Promise<CreditCheckResult> {
  const {
    userId,
    verificationId,
    firstName,
    lastName,
    address,
    city,
    state,
    zip,
    ssn,
    creditCheckConsentAt,
    backgroundCheckConsentAt,
  } = params;

  const apiUrl = getISoftPullUrl();
  const isDev = process.env.NODE_ENV === "development";
  const requestId = generateRequestId();
  const startTime = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log("🚀 iSOFTPULL CREDIT CHECK STARTED");
  console.log("=".repeat(60));
  console.log("🔧 Environment:", isDev ? "development (mock)" : "production");
  console.log("🔗 API URL:", apiUrl);
  console.log("👤 User ID:", userId);
  console.log("📋 Verification ID:", verificationId);

  // Check for required credentials in production
  if (!isDev && !hasISoftPullKeys()) {
    console.error("❌ iSoftPull credentials not configured");
    return {
      success: false,
      errorType: "CREDENTIALS_NOT_CONFIGURED",
      message: "Verification service temporarily unavailable. Please try again later.",
    };
  }

  console.log("📋 Request data:", { firstName, lastName, address, city, state, zip, ssn: "***" });

  // Convert state abbreviation to full name (iSoftPull requires full names)
  const fullStateName = STATE_NAMES[state.toUpperCase()] || state;

  // Build form data for iSoftPull API
  const formData = new URLSearchParams();
  formData.append("first_name", firstName);
  formData.append("last_name", lastName);
  formData.append("address", address);
  formData.append("city", city);
  formData.append("state", fullStateName);
  formData.append("zip", zip);
  formData.append("ssn", ssn);

  console.log("📍 State converted:", state, "→", fullStateName);
  console.log("🔥 Calling iSoftPull API...");

  try {
    // Call the API (mock endpoint in dev, real endpoint in prod)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "api-key": process.env.ISOFTPULL_API_ID || "",
        "api-secret": process.env.ISOFTPULL_API_TOKEN || "",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ iSoftPull API error:", errorData);
      return {
        success: false,
        errorType: "API_ERROR",
        message: "iSoftPull API error",
        creditData: errorData,
      };
    }

    const creditData = await response.json();

    console.log("\n" + "=".repeat(60));
    console.log("✅ iSOFTPULL RESPONSE RECEIVED");
    console.log("=".repeat(60));
    console.log("FULL RESPONSE:", JSON.stringify(creditData, null, 2));
    console.log("=".repeat(60) + "\n");

    // Check for invalid SSN in response
    const identityScan = creditData.reports?.transunion?.identity_scan || creditData.reports?.equifax?.identity_scan;
    const fraudShield = creditData.reports?.transunion?.fraud_shield || creditData.reports?.equifax?.fraud_shield;

    const hasInvalidSSN =
      identityScan?.message?.includes("INVALID") ||
      fraudShield?.Indicators?.includes("INVALID");

    if (hasInvalidSSN) {
      const responseTimeMs = Date.now() - startTime;

      // Update verification with failure status
      const failedVerification = await prisma.verification.update({
        where: { id: verificationId },
        data: {
          creditStatus: "failed",
          creditCheckedAt: new Date(),
          creditCheckRequestedAt: new Date(startTime),
          creditCheckCompletedAt: new Date(),
          creditCheckRequestId: requestId,
        },
      });

      // Log failure audit trail
      console.log("\n" + "=".repeat(70));
      console.log("❌ VERIFICATION AUDIT TRAIL - CREDIT CHECK FAILED");
      console.log("=".repeat(70));
      console.log("\n--- IDENTIFICATION ---");
      console.log("Verification ID:", failedVerification.id);
      console.log("User ID:", userId);
      console.log("Subject Name:", firstName, lastName);
      console.log("SSN (masked):", maskSSN(ssn));
      console.log("\n--- FAILURE DETAILS ---");
      console.log("Error Type:", "INVALID_SSN");
      console.log("Error Message:", "The SSN provided could not be verified");
      console.log("Response Time:", responseTimeMs, "ms");
      console.log("Request ID:", requestId);
      console.log("\n--- ADDRESS SUBMITTED ---");
      console.log("Street:", address);
      console.log("City:", city);
      console.log("State:", state);
      console.log("ZIP:", zip);
      console.log("\n" + "=".repeat(70) + "\n");

      return {
        success: false,
        errorType: "INVALID_SSN",
        message: "The SSN provided could not be verified",
        creditData,
      };
    }

    // Check for no-hit / credit file not found
    const equifaxReport = creditData.reports?.equifax;
    const transunionReport = creditData.reports?.transunion;
    const hasNoHit =
      equifaxReport?.failure_type === "no-hit" ||
      transunionReport?.failure_type === "no-hit" ||
      creditData.intelligence?.result === "Failed" ||
      creditData.intelligence?.credit_score === "failed";

    if (hasNoHit) {
      const responseTimeMs = Date.now() - startTime;

      // Update verification with failure status
      const failedVerification = await prisma.verification.update({
        where: { id: verificationId },
        data: {
          creditStatus: "failed",
          creditCheckedAt: new Date(),
          creditCheckRequestedAt: new Date(startTime),
          creditCheckCompletedAt: new Date(),
          creditCheckRequestId: requestId,
        },
      });

      // Log failure audit trail
      console.log("\n" + "=".repeat(70));
      console.log("❌ VERIFICATION AUDIT TRAIL - CREDIT CHECK FAILED");
      console.log("=".repeat(70));
      console.log("\n--- IDENTIFICATION ---");
      console.log("Verification ID:", failedVerification.id);
      console.log("User ID:", userId);
      console.log("Subject Name:", firstName, lastName);
      console.log("SSN (masked):", maskSSN(ssn));
      console.log("\n--- FAILURE DETAILS ---");
      console.log("Error Type:", "NO_CREDIT_FILE");
      console.log("Error Message:", "No credit file was found for the provided information");
      console.log("Response Time:", responseTimeMs, "ms");
      console.log("Request ID:", requestId);
      console.log("\n--- ADDRESS SUBMITTED ---");
      console.log("Street:", address);
      console.log("City:", city);
      console.log("State:", state);
      console.log("ZIP:", zip);
      console.log("\n" + "=".repeat(70) + "\n");

      return {
        success: false,
        errorType: "NO_CREDIT_FILE",
        message: "No credit file was found for the provided information",
        creditData,
      };
    }

    // Save response to file for debugging (non-critical)
    try {
      const filePath = join(process.cwd(), "isoftpull-response.json");
      await writeFile(filePath, JSON.stringify(creditData, null, 2));
      console.log(`📁 Response saved to: ${filePath}`);
    } catch (fileError) {
      console.error("❌ Failed to save response to file:", fileError);
    }

    // Extract credit data
    const reportUrl = creditData.reports?.link || null;
    const creditBucket = creditData.intelligence?.name || "Fair";

    // Update credit report in database
    await prisma.creditReport.upsert({
      where: { userId },
      update: {
        creditBucket,
        creditUpdatedAt: new Date(),
      },
      create: {
        userId,
        creditBucket,
        creditUpdatedAt: new Date(),
      },
    });

    const securityContext = await getSecurityContext();
    const responseTimeMs = Date.now() - startTime;

    // Calculate screening date and validity period (90 days)
    const screeningDate = new Date();
    const validUntil = new Date(screeningDate);
    validUntil.setDate(validUntil.getDate() + 90);

    // Update verification with credit data
    const updatedVerification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        subjectFirstName: firstName,
        subjectLastName: lastName,
        creditReportUrl: reportUrl,
        creditBucket,
        creditStatus: "completed",
        creditCheckedAt: new Date(),
        screeningDate,
        validUntil,
        creditCheckConsentAt: creditCheckConsentAt ? new Date(creditCheckConsentAt) : undefined,
        backgroundCheckConsentAt: backgroundCheckConsentAt ? new Date(backgroundCheckConsentAt) : undefined,
        creditCheckRequestedAt: new Date(startTime),
        creditCheckCompletedAt: new Date(),
        creditCheckRequestId: requestId,
        permissiblePurpose: "rental_screening",
        consentIpAddress: securityContext.ipAddress,
        consentUserAgent: securityContext.userAgent,
        consentCity: securityContext.city,
        consentRegion: securityContext.region,
        consentCountry: securityContext.country,
      },
    });

    // Log verification state for audit trail
    console.log("\n" + "=".repeat(70));
    console.log("📋 VERIFICATION AUDIT TRAIL - CREDIT CHECK COMPLETED");
    console.log("=".repeat(70));

    // Identification
    console.log("\n--- IDENTIFICATION ---");
    console.log("Verification ID:", updatedVerification.id);
    console.log("User ID:", userId);
    console.log("Subject Name:", updatedVerification.subjectFirstName, updatedVerification.subjectLastName);
    console.log("SSN (masked):", maskSSN(ssn));

    // Request Details
    console.log("\n--- REQUEST DETAILS ---");
    console.log("Request ID:", updatedVerification.creditCheckRequestId);
    console.log("Request Started:", updatedVerification.creditCheckRequestedAt);
    console.log("Request Completed:", updatedVerification.creditCheckCompletedAt);
    console.log("Response Time:", responseTimeMs, "ms");
    console.log("Provider:", "iSoftPull");
    console.log("Permissible Purpose:", updatedVerification.permissiblePurpose);

    // Results
    console.log("\n--- RESULTS ---");
    console.log("Credit Status:", updatedVerification.creditStatus);
    console.log("Credit Bucket:", updatedVerification.creditBucket);
    console.log("Credit Score:", creditData.intelligence?.credit_score || "N/A");
    console.log("Report URL:", reportUrl || "N/A");

    // Consent & Authorization
    console.log("\n--- CONSENT & AUTHORIZATION ---");
    console.log("Credit Check Consent At:", updatedVerification.creditCheckConsentAt || "Not recorded");
    console.log("Background Check Consent At:", updatedVerification.backgroundCheckConsentAt || "Not recorded");

    // Security Context
    console.log("\n--- SECURITY CONTEXT ---");
    console.log("IP Address:", updatedVerification.consentIpAddress || "N/A");
    console.log("User Agent:", updatedVerification.consentUserAgent || "N/A");
    console.log("Location:", [updatedVerification.consentCity, updatedVerification.consentRegion, updatedVerification.consentCountry].filter(Boolean).join(", ") || "N/A");

    // Validity
    console.log("\n--- VALIDITY PERIOD ---");
    console.log("Screening Date:", updatedVerification.screeningDate);
    console.log("Valid Until:", updatedVerification.validUntil);

    // Address Used
    console.log("\n--- ADDRESS SUBMITTED ---");
    console.log("Street:", address);
    console.log("City:", city);
    console.log("State:", state, "→", fullStateName);
    console.log("ZIP:", zip);

    console.log("\n" + "=".repeat(70) + "\n");

    // Log API response for audit
    await logApiResponse(
      verificationId,
      "isoftpull",
      requestId,
      true,
      {
        creditBucket: creditData.intelligence?.name,
        ssnLast4: maskSSN(ssn),
        city,
        state,
      },
      responseTimeMs
    );

    console.log("✅ Credit report and verification saved to database");
    console.log("📎 Report URL:", reportUrl);

    return {
      success: true,
      creditBucket,
      creditData,
      reportUrl: reportUrl || undefined,
    };
  } catch (error) {
    console.error("❌ iSoftPull error:", error);
    return {
      success: false,
      errorType: "API_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

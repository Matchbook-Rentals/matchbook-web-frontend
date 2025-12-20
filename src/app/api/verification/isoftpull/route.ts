import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      console.log("❌ [iSoftPull] Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getISoftPullUrl();
    const isDev = process.env.NODE_ENV === 'development';

    console.log("\n" + "=".repeat(60));
    console.log("🚀 iSOFTPULL CREDIT CHECK STARTED");
    console.log("=".repeat(60));
    console.log("🔧 Environment:", isDev ? "development (mock)" : "production");
    console.log("🔗 API URL:", apiUrl);
    console.log("👤 User ID:", userId);

    // Check for required credentials in production
    if (!isDev && !hasISoftPullKeys()) {
      console.error("❌ iSoftPull credentials not configured");
      return NextResponse.json(
        {
          error: "Verification service temporarily unavailable. Please try again later.",
          code: "CREDENTIALS_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      ssn,
      creditCheckConsentAt,
      backgroundCheckConsentAt,
    } = body;

    const requestId = generateRequestId();
    const startTime = Date.now();

    // Validate required fields
    if (!firstName || !lastName || !address || !city || !state || !zip || !ssn) {
      console.log("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      return NextResponse.json(
        { error: "iSoftPull API error", details: errorData },
        { status: response.status }
      );
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
      console.log("⚠️ Invalid SSN detected in iSoftPull response");
      return NextResponse.json({
        success: false,
        errorType: "INVALID_SSN",
        message: "The SSN provided could not be verified",
        creditData,
      });
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
      console.log("⚠️ No credit file found (no-hit) in iSoftPull response");
      return NextResponse.json({
        success: false,
        errorType: "NO_CREDIT_FILE",
        message: "No credit file was found for the provided information",
        creditData,
      });
    }

    // Save response to file for debugging (non-critical)
    try {
      const filePath = join(process.cwd(), "isoftpull-response.json");
      await writeFile(filePath, JSON.stringify(creditData, null, 2));
      console.log(`📁 Response saved to: ${filePath}`);
    } catch (fileError) {
      console.error("❌ Failed to save response to file:", fileError);
    }

    // Update credit report in database
    const reportUrl = creditData.reports?.link || null;
    const creditBucket = creditData.intelligence?.name || "Fair";

    try {
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

      // Find existing verification or create one
      let existingVerification = await prisma.verification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      let verification = existingVerification;
      if (existingVerification) {
        // Update existing verification with credit data
        verification = await prisma.verification.update({
          where: { id: existingVerification.id },
          data: {
            subjectFirstName: firstName,
            subjectLastName: lastName,
            creditReportUrl: reportUrl,
            creditBucket,
            creditStatus: "completed",
            creditCheckedAt: new Date(),
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
      } else {
        // No verification exists - create one and link to unredeemed purchase
        console.log("📝 No verification found, creating new one...");

        const unredeemedPurchase = await prisma.purchase.findFirst({
          where: {
            userId,
            type: { in: ['backgroundCheck', 'matchbookVerification'] },
            isRedeemed: false,
          },
          orderBy: { createdAt: 'desc' },
        });

        verification = await prisma.verification.create({
          data: {
            userId,
            purchaseId: unredeemedPurchase?.id,
            status: "PROCESSING_CREDIT",
            subjectFirstName: firstName,
            subjectLastName: lastName,
            creditReportUrl: reportUrl,
            creditBucket,
            creditStatus: "completed",
            creditCheckedAt: new Date(),
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
        console.log("✅ Created new verification:", verification.id);
      }

      if (verification) {
        await logApiResponse(
          verification.id,
          'isoftpull',
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
      }

      console.log("✅ Credit report and verification saved to database");
      console.log("📎 Report URL:", reportUrl);
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
    }

    return NextResponse.json({
      success: true,
      creditData,
    });
  } catch (error) {
    console.error("❌ iSoftPull error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

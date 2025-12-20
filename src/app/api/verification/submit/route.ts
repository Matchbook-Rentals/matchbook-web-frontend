import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { generateVerificationXml } from "@/app/app/rent/verification/utils";
import { getAccioUrl, hasAccioKeys } from "@/lib/verification/config";

// Accio API credentials
const ACCOUNT_DETAILS = {
  account: process.env.ACCIO_ACCOUNT || "",
  username: process.env.ACCIO_USERNAME || "",
  password: process.env.ACCIO_PASSWORD || "",
};

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.json();
    console.log('📋 [Verification Submit] Received formData:', JSON.stringify(formData, null, 2));
    const {
      firstName,
      lastName,
      ssn,
      dob,
      address,
      city,
      state,
      zip,
    } = formData;
    console.log('📋 [Verification Submit] Extracted firstName:', firstName, 'lastName:', lastName);

    // Validate required fields
    if (!firstName || !lastName || !ssn || !dob || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for unredeemed purchase
    const unredeemedPurchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        type: "matchbookVerification",
        isRedeemed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!unredeemedPurchase) {
      return NextResponse.json(
        { error: "No unredeemed verification purchase found. Please complete payment first." },
        { status: 403 }
      );
    }

    // Create new Verification record (multiple verifications per user allowed)
    let verification = await prisma.verification.create({
      data: {
        userId: user.id,
        purchaseId: unredeemedPurchase.id,
        status: "PROCESSING_CREDIT",
        subjectFirstName: firstName,
        subjectLastName: lastName,
      },
    });

    // ========================================
    // STEP 1: iSoftPull Credit Check (Free if fail)
    // ========================================
    try {
      console.log('\n📤 [Verification] Calling iSoftPull API...');

      const isoftpullResponse = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/background-check/credit-score/isoftpull`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-request": "true",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            address,
            city,
            state,
            zip,
            ssn,
          }),
        }
      );

      console.log(`📥 [Verification] iSoftPull response status: ${isoftpullResponse.status}`);

      const creditData = await isoftpullResponse.json();

      if (!isoftpullResponse.ok || creditData.intelligence?.result !== "passed") {
        // Credit check failed - stop here, don't charge for Accio
        await prisma.verification.update({
          where: { id: verification.id },
          data: {
            status: "CREDIT_FAILED",
            creditStatus: "failed",
            creditCheckedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: false,
          status: "CREDIT_FAILED",
          message: "Credit check did not pass minimum requirements",
        });
      }

      // Credit check passed - update verification
      const creditBucketMap: Record<string, any> = {
        "excellent": "Exceptional",
        "good": "Good",
        "fair": "Fair",
        "poor": "Low",
      };

      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          creditStatus: "completed",
          creditBucket: creditBucketMap[creditData.intelligence.name] || "Fair",
          creditCheckedAt: new Date(),
          status: "PROCESSING_BGS", // Move to background check stage
        },
      });

    } catch (error) {
      console.error("iSoftPull credit check error:", error);
      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: "FAILED",
          creditStatus: "error",
          notes: error instanceof Error ? error.message : "Unknown error during credit check",
        },
      });
      return NextResponse.json(
        { error: "Credit check failed due to technical error" },
        { status: 500 }
      );
    }

    // ========================================
    // STEP 2: Accio Data Background Check (Paid)
    // ========================================
    try {
      const accioUrl = getAccioUrl();
      const isDev = process.env.NODE_ENV === 'development';

      console.log("\n" + "=".repeat(60));
      console.log("🚀 ACCIO BACKGROUND CHECK STARTED");
      console.log("=".repeat(60));
      console.log("🔧 Environment:", isDev ? "development (mock)" : "production");
      console.log("🔗 API URL:", accioUrl);

      // Check for required credentials in production
      if (!isDev && !hasAccioKeys()) {
        console.error("❌ Accio credentials not configured");
        return NextResponse.json(
          {
            error: "Verification service temporarily unavailable. Please try again later.",
            code: "CREDENTIALS_NOT_CONFIGURED",
          },
          { status: 503 }
        );
      }

      const orderNumber = isDev ? `MOCK-${Date.now()}` : `MBWEB-${Date.now()}`;

      // Generate XML payload for Accio Data
      const xmlPayload = generateVerificationXml(
        {
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
        },
        ACCOUNT_DETAILS
      );

      console.log("📋 Submitting to Accio...");
      console.log("📄 [OUTGOING] XML Payload:\n", xmlPayload);

      // Call the API (mock endpoint in dev, real endpoint in prod)
      const accioResponse = await fetch(accioUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlPayload,
      });

      if (!accioResponse.ok) {
        const errorText = await accioResponse.text();
        console.error("❌ Accio API error:", errorText);
        throw new Error(`Accio Data API error: ${accioResponse.status}`);
      }

      const responseText = await accioResponse.text();
      console.log("✅ Accio response:", responseText);

      // Mark purchase as redeemed
      await prisma.purchase.update({
        where: { id: unredeemedPurchase.id },
        data: {
          orderId: orderNumber,
          isRedeemed: true,
          status: "completed",
        },
      });

      // Create BGSReport for tracking
      const bgsReport = await prisma.bGSReport.create({
        data: {
          purchaseId: unredeemedPurchase.id,
          userId: user.id,
          orderId: orderNumber,
          status: "pending",
        },
      });

      // Update Verification with BGS report link
      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          bgsReportId: bgsReport.id,
          backgroundCheckedAt: new Date(),
        },
      });

      const message = isDev
        ? "Background check submitted successfully (MOCK). Webhook will trigger in ~2 seconds."
        : "Background check submitted successfully. Results typically arrive within 24-48 hours, but can take up to 2 weeks.";

      return NextResponse.json({
        success: true,
        status: "PROCESSING_BGS",
        orderId: orderNumber,
        message,
      });

    } catch (error) {
      console.error("Accio Data background check error:", error);
      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: "FAILED",
          notes: error instanceof Error ? error.message : "Unknown error during background check submission",
        },
      });
      return NextResponse.json(
        { error: "Background check submission failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Verification submission error:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 }
    );
  }
}

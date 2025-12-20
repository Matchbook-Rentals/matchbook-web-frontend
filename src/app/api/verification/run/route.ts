/**
 * Verification Orchestrator Route
 *
 * Single endpoint that handles the entire verification flow atomically:
 * 1. Validate user & get unredeemed purchase
 * 2. Create verification record
 * 3. Run credit check (iSoftPull)
 * 4. If credit passes, run background check (Accio)
 * 5. Return result
 *
 * This ensures the full flow completes even if user leaves the page.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { runCreditCheck } from "@/lib/verification/credit-check";
import { runBackgroundCheck } from "@/lib/verification/background-check";

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      console.log("❌ [Verification Run] Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      dob,
      creditCheckConsentAt,
      backgroundCheckConsentAt,
    } = body;

    console.log("\n" + "=".repeat(80));
    console.log("🚀 VERIFICATION FLOW STARTED");
    console.log("=".repeat(80));
    console.log("👤 User ID:", userId);
    console.log("📋 Subject:", firstName, lastName);

    // Validate required fields
    if (!firstName || !lastName || !address || !city || !state || !zip || !ssn || !dob) {
      console.log("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step 1: Find unredeemed purchase
    const unredeemedPurchase = await prisma.purchase.findFirst({
      where: {
        userId,
        type: { in: ["backgroundCheck", "matchbookVerification"] },
        isRedeemed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!unredeemedPurchase) {
      console.log("❌ No unredeemed purchase found");
      return NextResponse.json(
        { error: "No unredeemed verification purchase found. Please complete payment first." },
        { status: 403 }
      );
    }

    console.log("✅ Found unredeemed purchase:", unredeemedPurchase.id);

    // Step 2: Find existing verification for this purchase OR create new
    // On retry, we reuse the existing verification (don't create duplicates)
    // TODO: Need cron to clean up abandoned verifications older than 7 days
    // TODO: Add creditCheckAttempts field to track first/second failure so we can
    //       bring users back to the right page when they revisit (retry vs refunded)
    let verification = await prisma.verification.findFirst({
      where: { purchaseId: unredeemedPurchase.id },
    });

    if (!verification) {
      // First attempt - create new verification
      verification = await prisma.verification.create({
        data: {
          userId,
          purchaseId: unredeemedPurchase.id,
          status: "PROCESSING_CREDIT",
          subjectFirstName: firstName,
          subjectLastName: lastName,
        },
      });
      console.log("✅ Created new verification:", verification.id);
    } else {
      // Retry - update existing verification with new subject info
      verification = await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: "PROCESSING_CREDIT",
          subjectFirstName: firstName,
          subjectLastName: lastName,
        },
      });
      console.log("🔄 Retrying existing verification:", verification.id);
    }

    // Step 3: Run credit check
    console.log("\n📊 Step 3: Running credit check...");
    const creditResult = await runCreditCheck({
      userId,
      verificationId: verification.id,
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      ssn,
      creditCheckConsentAt,
      backgroundCheckConsentAt,
    });

    if (!creditResult.success) {
      console.log("❌ Credit check failed:", creditResult.errorType);

      // Update verification status
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: "CREDIT_FAILED" },
      });

      return NextResponse.json({
        success: false,
        errorType: creditResult.errorType,
        message: creditResult.message,
        creditData: creditResult.creditData,
      });
    }

    console.log("✅ Credit check passed:", creditResult.creditBucket);

    // Step 4: Run background check
    console.log("\n🔍 Step 4: Running background check...");
    const bgsResult = await runBackgroundCheck({
      userId,
      verificationId: verification.id,
      purchaseId: unredeemedPurchase.id,
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
    });

    if (!bgsResult.success) {
      console.log("❌ Background check submission failed:", bgsResult.errorType);

      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json({
        success: false,
        errorType: bgsResult.errorType,
        message: bgsResult.message,
      });
    }

    console.log("✅ Background check submitted:", bgsResult.orderNumber);

    // Step 5: Return success
    console.log("\n" + "=".repeat(80));
    console.log("✅ VERIFICATION FLOW COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log("📋 Verification ID:", verification.id);
    console.log("📊 Credit Bucket:", creditResult.creditBucket);
    console.log("🔍 BGS Order:", bgsResult.orderNumber);
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      status: "PROCESSING_BGS",
      verificationId: verification.id,
      creditBucket: creditResult.creditBucket,
      orderNumber: bgsResult.orderNumber,
      message: "Verification submitted successfully. Background check results typically arrive within 24-48 hours.",
    });
  } catch (error) {
    console.error("❌ Verification flow error:", error);
    return NextResponse.json(
      { error: "Failed to process verification", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prismadb from "@/lib/prismadb"

// Mark verification as COMPLETED after successful payment capture
// Background check webhook will update eviction/criminal results later
// NOTE: creditBucket is already set by iSoftPull - don't overwrite it
export async function POST() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setDate(validUntil.getDate() + 90)

    // Find the most recent verification for this user
    const existingVerification = await prismadb.verification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!existingVerification) {
      return NextResponse.json({ error: "No verification found" }, { status: 404 })
    }

    // Only update dates and background check statuses
    // DO NOT touch creditBucket - it's already set by iSoftPull
    // Status stays PENDING - only Accio webhook sets COMPLETED
    const verification = await prismadb.verification.update({
      where: { id: existingVerification.id },
      data: {
        status: "PROCESSING_BGS",
        screeningDate: now,
        validUntil: validUntil,
        // Background check pending - webhook will update with actual results
        evictionStatus: "Pending",
        criminalStatus: "Pending",
        evictionCount: 0,
        criminalRecordCount: 0,
      },
    })

    console.log("✅ [Verification] Finalized verification:", verification.id)
    console.log("   creditBucket:", verification.creditBucket)
    console.log("   screeningDate:", verification.screeningDate)

    return NextResponse.json({ success: true, verification })
  } catch (error) {
    console.error("❌ [Verification] Error finalizing:", error)
    return NextResponse.json(
      { error: "Failed to finalize verification" },
      { status: 500 }
    )
  }
}

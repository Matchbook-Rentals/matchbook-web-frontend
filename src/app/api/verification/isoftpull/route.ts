import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prismadb";

const ISOFTPULL_API_URL = "https://app.isoftpull.com/api/v2/reports";
const MOCK_MODE = false;

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

    console.log("\n" + "=".repeat(60));
    console.log("🚀 iSOFTPULL CREDIT CHECK STARTED");
    console.log("=".repeat(60));
    console.log("🔧 MOCK_MODE:", MOCK_MODE);
    console.log("👤 User ID:", userId);

    const body = await request.json();
    const { firstName, lastName, address, city, state, zip, ssn } = body;

    // Validate required fields
    if (!firstName || !lastName || !address || !city || !state || !zip || !ssn) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📋 Request data:", { firstName, lastName, address, city, state, zip, ssn: "***" });

    if (MOCK_MODE) {
      console.log("🎭 MOCK MODE: Returning fake credit data");
      return NextResponse.json({
        success: true,
        creditData: {
          intelligence: {
            result: "passed",
            name: "good",
            score: 720,
          },
        },
      });
    }

    // Real API call
    // Convert state abbreviation to full name (iSoftPull requires full names)
    const fullStateName = STATE_NAMES[state.toUpperCase()] || state;

    const formData = new URLSearchParams();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("address", address);
    formData.append("city", city);
    formData.append("state", fullStateName);
    formData.append("zip", zip);
    formData.append("ssn", ssn);

    console.log("📍 State converted:", state, "→", fullStateName);

    console.log("🔥 MODE: REAL - Calling iSoftPull API...");

    const response = await fetch(ISOFTPULL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "api-key": process.env.ISOFTPULL_API_ID!,
        "api-secret": process.env.ISOFTPULL_API_TOKEN!,
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

    // Save to file for TypeScript interface creation
    try {
      const filePath = join(process.cwd(), "isoftpull-response.json");
      await writeFile(filePath, JSON.stringify(creditData, null, 2));
      console.log(`📁 Response saved to: ${filePath}`);
    } catch (fileError) {
      console.error("❌ Failed to save response to file:", fileError);
    }

    // Update credit report in database
    const reportUrl = creditData.reports?.link || null;

    try {
      // Update or create CreditReport
      await prisma.creditReport.upsert({
        where: { userId },
        update: {
          creditBucket: creditData.intelligence?.name || "Fair",
          creditUpdatedAt: new Date(),
        },
        create: {
          userId,
          creditBucket: creditData.intelligence?.name || "Fair",
          creditUpdatedAt: new Date(),
        },
      });

      // Update Verification with report URL
      await prisma.verification.upsert({
        where: { userId },
        update: {
          creditReportUrl: reportUrl,
          creditBucket: creditData.intelligence?.name || "Fair",
          creditStatus: "completed",
          creditCheckedAt: new Date(),
        },
        create: {
          userId,
          creditReportUrl: reportUrl,
          creditBucket: creditData.intelligence?.name || "Fair",
          creditStatus: "completed",
          creditCheckedAt: new Date(),
        },
      });

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

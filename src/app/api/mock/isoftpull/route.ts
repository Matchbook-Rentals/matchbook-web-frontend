import { NextResponse } from "next/server";

/**
 * Mock iSoftPull Credit Check Endpoint
 *
 * Logs the request and returns mock credit data.
 * Returns the same response format as the real iSoftPull API.
 *
 * Note: This endpoint accepts form-urlencoded data (same as real iSoftPull)
 * but we also support JSON for easier testing.
 */
export async function POST(request: Request) {
  // Parse request body (support both form-urlencoded and JSON)
  let first_name: string, last_name: string, address: string, city: string, state: string, zip: string, ssn: string;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.text();
    const params = new URLSearchParams(formData);
    first_name = params.get("first_name") || "";
    last_name = params.get("last_name") || "";
    address = params.get("address") || "";
    city = params.get("city") || "";
    state = params.get("state") || "";
    zip = params.get("zip") || "";
    ssn = params.get("ssn") || "";
  } else {
    const body = await request.json();
    first_name = body.first_name;
    last_name = body.last_name;
    address = body.address;
    city = body.city;
    state = body.state;
    zip = body.zip;
    ssn = body.ssn;
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎭 [MOCK iSoftPull] Credit Check Request");
  console.log("=".repeat(60));
  console.log("📋 Request:", {
    first_name,
    last_name,
    address,
    city,
    state,
    zip,
    ssn: ssn ? `***-**-${ssn.slice(-4)}` : "missing",
  });
  console.log("=".repeat(60));

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // SSN 555555555 = no-hit test case (no credit file found)
  if (ssn === "555555555") {
    console.log("🎭 [MOCK] Returning NO_CREDIT_FILE (no-hit) response");
    return NextResponse.json({
      applicant: {
        first_name,
        last_name,
        address,
        city,
        state,
        zip,
        ssn: "***masked***",
      },
      intelligence: {
        name: null,
        result: "Failed",
        credit_score: "failed",
      },
      reports: {
        equifax: {
          failure_type: "no-hit",
          message: "No credit file found",
        },
      },
    });
  }

  // SSN 000000000 = invalid SSN test case
  if (ssn === "000000000") {
    console.log("🎭 [MOCK] Returning INVALID_SSN response");
    return NextResponse.json({
      applicant: { first_name, last_name },
      reports: {
        equifax: {
          identity_scan: {
            message: "INVALID SSN",
          },
        },
      },
    });
  }

  // Default: Return "Very_Good" credit score (matches iSoftPull format)
  console.log("🎭 [MOCK] Returning successful credit response (Very_Good)");
  return NextResponse.json({
    applicant: {
      first_name,
      last_name,
      address,
      city,
      state,
      zip,
      ssn: "***masked***",
    },
    intelligence: {
      name: "Very_Good",
      result: "passed",
      credit_score: "750",
    },
    reports: {
      link: "https://app.isoftpull.com/mock-report",
      equifax: {
        status: "success",
        message: "Mock credit report",
      },
    },
  });
}

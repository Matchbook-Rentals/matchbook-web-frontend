import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Sample test data for the background check
    const testData = {
      firstName: "John",
      lastName: "Doe", 
      ssn: "123456789",
      dob: "1990-01-15",
      address: "123 Main Street",
      city: "Anytown",
      state: "CA",
      zip: "12345"
    };

    // Call the background check API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/background-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    return NextResponse.json({
      testData,
      apiResponse: result,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to test background check API",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
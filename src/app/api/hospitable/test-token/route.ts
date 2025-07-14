import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Test the Hospitable API with the access token
    const testToken = process.env.HOSPITABLE_ACCESS_TOKEN;
    console.log(testToken)
    
    if (!testToken) {
      return NextResponse.json({ 
        error: "No test token configured" 
      }, { status: 400 });
    }

    const testResults = [];

    // Test with correct API base URL from documentation
    const testCases = [
      {
        name: "properties with Bearer token (correct URL)",
        url: 'https://public.api.hospitable.com/properties',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        name: "user with Bearer token",
        url: 'https://public.api.hospitable.com/user',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        name: "me with Bearer token",
        url: 'https://public.api.hospitable.com/me',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        name: "account with Bearer token",
        url: 'https://public.api.hospitable.com/account',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await fetch(testCase.url, {
          method: 'GET',
          headers: testCase.headers,
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        testResults.push({
          test: testCase.name,
          status: response.status,
          success: response.ok,
          data: response.ok ? responseData : undefined,
          error: !response.ok ? responseData : undefined
        });

        // If we found a working endpoint, break
        if (response.ok) {
          break;
        }
      } catch (error) {
        testResults.push({
          test: testCase.name,
          status: 'network_error',
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return NextResponse.json({
      testToken: testToken ? `${testToken.substring(0, 10)}...` : 'none',
      results: testResults,
      summary: testResults.find(r => r.success) ? 'Found working endpoint!' : 'No working endpoints found'
    });

  } catch (error) {
    console.error("Hospitable test error:", error);
    return NextResponse.json(
      { error: "Failed to test Hospitable connection: " + (error as Error).message },
      { status: 500 }
    );
  }
}

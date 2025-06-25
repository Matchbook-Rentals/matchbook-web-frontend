import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';

// Use the provided test credentials (same as background-check route)
const ACCOUNT_DETAILS = {
  account: "matchbook",
  username: "tyler",
  password: "5IZB$AZ4"
};

const ACCIO_DATA_URL = "https://matchbook.acciodata.com/c/p/researcherxml";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the BGS report with this order ID
    const report = await prisma.bGSReport.findFirst({
      where: {
        orderId: orderId
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: "BGS report not found for this order ID" },
        { status: 404 }
      );
    }

    // Construct the XML request for retrieving order results
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<XML>
    <login>
        <account>${ACCOUNT_DETAILS.account}</account>
        <username>${ACCOUNT_DETAILS.username}</username>
        <password>${ACCOUNT_DETAILS.password}</password>
    </login>
    <getOrderResults orderID="${orderId}" />
</XML>`;

    console.log(`Retrieving results for order ${orderId}`);
    console.log('XML Request:', xmlRequest);

    // Send the XML request to Accio Data
    const response = await fetch(ACCIO_DATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "User-Agent": "Matchbook-BGS-Client/1.0"
      },
      body: xmlRequest
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseText: responseText,
        orderId: orderId
      }, { status: response.status });
    }

    // Try to parse the response and update the report if results are available
    let hasResults = false;
    try {
      // Check if the response contains actual results (not just acknowledgment)
      if (responseText.includes('<results>') || responseText.includes('<order>')) {
        // Parse and save the results
        const { parseStringPromise } = await import('xml2js');
        const parsedXml = await parseStringPromise(responseText);
        
        // Update the BGS report with the results
        await prisma.bGSReport.update({
          where: {
            id: report.id
          },
          data: {
            status: 'completed',
            reportData: parsedXml,
            receivedAt: new Date()
          }
        });
        
        hasResults = true;
        console.log(`Updated BGS report ${report.id} with retrieved results`);
      }
    } catch (parseError) {
      console.warn('Could not parse XML response:', parseError);
    }

    return NextResponse.json({
      success: true,
      message: hasResults ? "Order results retrieved and saved" : "Request sent successfully",
      orderId: orderId,
      hasResults: hasResults,
      responseStatus: response.status,
      responseText: responseText
    });

  } catch (error) {
    console.error('Error retrieving order results:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to retrieve order results",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
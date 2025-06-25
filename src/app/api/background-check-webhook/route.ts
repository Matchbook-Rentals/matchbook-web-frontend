import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';
import { parseStringPromise } from 'xml2js';

export async function POST(request: NextRequest) {
  try {
    // Get the raw XML from the request body
    const xmlData = await request.text();
    
    console.log('Received background check webhook:', xmlData);
    
    // Parse the XML response
    const parsedXml = await parseStringPromise(xmlData);
    
    // Extract order ID from the XML structure
    // Based on Accio Data documentation, the structure should contain order information
    let orderId: string | null = null;
    let reportData: any = null;
    
    // Navigate through the XML structure to find order information
    if (parsedXml?.XML?.getOrderResults?.[0]?.['$']?.orderID) {
      orderId = parsedXml.XML.getOrderResults[0]['$'].orderID;
      reportData = parsedXml.XML.getOrderResults[0];
    } else if (parsedXml?.XML?.order?.[0]?.['$']?.orderID) {
      orderId = parsedXml.XML.order[0]['$'].orderID;
      reportData = parsedXml.XML.order[0];
    } else {
      // Try to find orderId in other possible locations
      const xmlString = JSON.stringify(parsedXml);
      const orderIdMatch = xmlString.match(/"orderID":\s*"(\d+)"/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
        reportData = parsedXml;
      }
    }
    
    if (!orderId) {
      console.error('Could not extract order ID from XML:', parsedXml);
      return NextResponse.json(
        { error: "Order ID not found in XML response" },
        { status: 400 }
      );
    }
    
    // Find the BGSReport with this orderId
    const existingReport = await prisma.bGSReport.findFirst({
      where: {
        orderId: orderId
      },
      include: {
        purchase: true,
        user: true
      }
    });
    
    if (!existingReport) {
      console.error(`No BGS report found for order ID: ${orderId}`);
      return NextResponse.json(
        { error: "BGS report not found for this order ID" },
        { status: 404 }
      );
    }
    
    // Update the existing BGSReport
    await prisma.bGSReport.update({
      where: {
        id: existingReport.id
      },
      data: {
        status: 'completed',
        reportData: reportData,
        receivedAt: new Date()
      }
    });
    
    console.log(`Updated BGS report for order ${orderId}`);
    
    // Optionally update the purchase status if there is a purchase
    if (existingReport.purchaseId) {
      await prisma.purchase.update({
        where: {
          id: existingReport.purchaseId
        },
        data: {
          status: 'completed'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Background check results received and processed",
      orderId: orderId
    });
    
  } catch (error) {
    console.error('Error processing background check webhook:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to process background check results",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: "Background check webhook endpoint is active",
    endpoint: "/api/background-check-webhook",
    method: "POST",
    contentType: "text/xml"
  });
}
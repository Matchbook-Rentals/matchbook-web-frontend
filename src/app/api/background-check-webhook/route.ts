import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';
import { parseStringPromise } from 'xml2js';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  console.log('🔔 [Background Check Webhook] Received webhook request');

  try {
    // Get the raw XML from the request body
    const xmlData = await request.text();

    console.log('📦 [Background Check Webhook] Raw XML payload:', xmlData.substring(0, 1000));
    console.log('📏 [Background Check Webhook] XML length:', xmlData.length, 'characters');

    // Parse the XML response
    console.log('🔍 [Background Check Webhook] Parsing XML...');
    const parsedXml = await parseStringPromise(xmlData);
    console.log('✅ [Background Check Webhook] XML parsed successfully');
    console.log('📋 [Background Check Webhook] Parsed structure:', JSON.stringify(parsedXml, null, 2).substring(0, 1000));
    
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
      console.error('❌ [Background Check Webhook] Could not extract order ID from XML');
      console.error('   Parsed XML structure:', JSON.stringify(parsedXml, null, 2));
      return NextResponse.json(
        { error: "Order ID not found in XML response" },
        { status: 400 }
      );
    }

    console.log('🔑 [Background Check Webhook] Extracted order ID:', orderId);

    // Find the BGSReport with this orderId
    console.log('🔍 [Background Check Webhook] Looking up BGS report for order:', orderId);
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
      console.error(`❌ [Background Check Webhook] No BGS report found for order ID: ${orderId}`);
      console.error('   This order ID does not exist in our database');
      return NextResponse.json(
        { error: "BGS report not found for this order ID" },
        { status: 404 }
      );
    }

    console.log('✅ [Background Check Webhook] Found BGS report:', {
      reportId: existingReport.id,
      userId: existingReport.userId,
      purchaseId: existingReport.purchaseId,
      currentStatus: existingReport.status
    });

    // Update the existing BGSReport
    console.log('💾 [Background Check Webhook] Updating BGS report status to completed...');
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
    
    console.log(`✅ [Background Check Webhook] Updated BGS report for order ${orderId}`);

    // Optionally update the purchase status if there is a purchase
    if (existingReport.purchaseId) {
      console.log('💾 [Background Check Webhook] Updating linked purchase:', existingReport.purchaseId);
      await prisma.purchase.update({
        where: {
          id: existingReport.purchaseId
        },
        data: {
          status: 'completed'
        }
      });
      console.log('✅ [Background Check Webhook] Purchase status updated to completed');
    } else {
      console.log('ℹ️ [Background Check Webhook] No linked purchase to update');
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ [Background Check Webhook] Webhook processed successfully');
    console.log('⏱️ [Background Check Webhook] Processing time:', processingTime, 'ms');

    return NextResponse.json({
      success: true,
      message: "Background check results received and processed",
      orderId: orderId
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [Background Check Webhook] Error processing webhook:', error);
    console.error('   Error type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('⏱️ [Background Check Webhook] Failed after:', processingTime, 'ms');

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
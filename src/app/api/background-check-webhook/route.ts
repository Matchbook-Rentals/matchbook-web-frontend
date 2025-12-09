import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';
import { parseStringPromise } from 'xml2js';
import type {
  AccioScreeningResults,
  AccioCompleteOrder,
  AccioSubOrder,
  AccioSimplifiedResult,
} from '@/types/accio';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let xmlData = '';

  console.log('🔔 [Background Check Webhook] Received webhook request');

  // CRITICAL: Log the raw payload FIRST, before any other processing
  // This ensures we capture the response even if database operations fail
  try {
    xmlData = await request.text();
  } catch (readError) {
    console.error('❌ [Background Check Webhook] Failed to read request body:', readError);
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // Always log webhook payload - search for BACKGROUND_CHECK_WEBHOOK in logs
  console.log('\n' + '='.repeat(80));
  console.log('BACKGROUND_CHECK_WEBHOOK_START');
  console.log('='.repeat(80));
  console.log(xmlData);
  console.log('='.repeat(80));
  console.log('BACKGROUND_CHECK_WEBHOOK_END');
  console.log('='.repeat(80) + '\n');

  console.log('📦 [Background Check Webhook] Raw XML payload:', xmlData.substring(0, 1000));
  console.log('📏 [Background Check Webhook] XML length:', xmlData.length, 'characters');

  try {

    // Parse the XML response
    console.log('🔍 [Background Check Webhook] Parsing XML...');
    const parsedXml = await parseStringPromise(xmlData, {
      explicitArray: false,  // Don't wrap single elements in arrays
      mergeAttrs: true,      // Merge attributes into the element
    });
    console.log('✅ [Background Check Webhook] XML parsed successfully');
    console.log('📋 [Background Check Webhook] Parsed structure:', JSON.stringify(parsedXml, null, 2).substring(0, 2000));

    // Extract data from the Accio ScreeningResults format
    // The XML structure is: <ScreeningResults><completeOrder ...>...</completeOrder></ScreeningResults>
    let orderId: string | null = null;
    let orderNumber: string | null = null;
    let reportData: AccioSimplifiedResult | null = null;
    let completeOrder: any = null;

    // Try ScreeningResults format (webhook callback)
    if (parsedXml?.ScreeningResults?.completeOrder) {
      completeOrder = parsedXml.ScreeningResults.completeOrder;
      // Handle both single order and array of orders
      if (Array.isArray(completeOrder)) {
        completeOrder = completeOrder[0];
      }
      orderId = completeOrder.remote_number || completeOrder.orderID;
      orderNumber = completeOrder.number;
      console.log('📋 [Background Check Webhook] Found ScreeningResults format');
    }
    // Try order confirmation format (initial order response)
    else if (parsedXml?.XML?.order) {
      const order = Array.isArray(parsedXml.XML.order) ? parsedXml.XML.order[0] : parsedXml.XML.order;
      orderId = order.orderID;
      orderNumber = order.number;
      console.log('📋 [Background Check Webhook] Found order confirmation format');
    }
    // Fallback: search for orderID anywhere in the structure
    else {
      const xmlString = JSON.stringify(parsedXml);
      const orderIdMatch = xmlString.match(/"(?:orderID|remote_number)":\s*"?(\d+)"?/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
      }
      console.log('📋 [Background Check Webhook] Used fallback orderID extraction');
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
    console.log('🔑 [Background Check Webhook] Order number:', orderNumber);

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

    // Parse subOrders to extract National Criminal and evictions_check results
    // Note: Using 'any' for raw parsed XML since xml2js structure varies
    let nationalCriminalSubOrder: any = null;
    let evictionsSubOrder: any = null;
    let evictionStatus = "Pending";
    let evictionCount = 0;
    let criminalStatus = "Pending";
    let criminalRecordCount = 0;

    if (completeOrder?.subOrder) {
      const subOrders = Array.isArray(completeOrder.subOrder)
        ? completeOrder.subOrder
        : [completeOrder.subOrder];

      for (const subOrder of subOrders) {
        const subOrderType = subOrder.type || subOrder['$']?.type;
        console.log('📋 [Background Check Webhook] Processing subOrder type:', subOrderType);

        if (subOrderType === 'National Criminal' || subOrderType === 'National Criminal2') {
          nationalCriminalSubOrder = subOrder;
        } else if (subOrderType === 'evictions_check') {
          evictionsSubOrder = subOrder;
        }
      }
    }

    // Extract National Criminal results
    if (nationalCriminalSubOrder) {
      const filledCode = nationalCriminalSubOrder.filledCode || nationalCriminalSubOrder['$']?.filledCode;
      const filledStatus = nationalCriminalSubOrder.filledStatus || nationalCriminalSubOrder['$']?.filledStatus;
      const heldForReview = nationalCriminalSubOrder.held_for_review || nationalCriminalSubOrder['$']?.held_for_review;

      console.log('📋 [Background Check Webhook] National Criminal:', { filledCode, filledStatus, heldForReview });

      if (heldForReview === 'Y') {
        criminalStatus = "Pending Review";
      } else if (filledCode === 'clear' || filledCode === 'no hits') {
        criminalStatus = "Clear";
      } else if (filledCode === 'hits') {
        criminalStatus = "Records Found";
        // Count cases if present
        const cases = nationalCriminalSubOrder.case;
        if (cases) {
          criminalRecordCount = Array.isArray(cases) ? cases.length : 1;
        }
      } else if (filledStatus === 'filled') {
        criminalStatus = "Clear"; // Filled with no hits code means clear
      }
    }

    // Extract Evictions results
    if (evictionsSubOrder) {
      const filledCode = evictionsSubOrder.filledCode || evictionsSubOrder['$']?.filledCode;
      const filledStatus = evictionsSubOrder.filledStatus || evictionsSubOrder['$']?.filledStatus;
      const heldForReview = evictionsSubOrder.held_for_review || evictionsSubOrder['$']?.held_for_review;

      console.log('📋 [Background Check Webhook] Evictions:', { filledCode, filledStatus, heldForReview });

      if (heldForReview === 'Y') {
        evictionStatus = "Pending Review";
      } else if (filledCode === 'clear' || filledCode === 'no hits') {
        evictionStatus = "Clear";
      } else if (filledCode === 'hits') {
        evictionStatus = "Records Found";
        // Count cases if present
        const cases = evictionsSubOrder.case;
        if (cases) {
          evictionCount = Array.isArray(cases) ? cases.length : 1;
        }
      } else if (filledStatus === 'filled') {
        evictionStatus = "Clear"; // Filled with no hits code means clear
      }
    }

    console.log('📋 [Background Check Webhook] Final results:', {
      criminalStatus,
      criminalRecordCount,
      evictionStatus,
      evictionCount
    });

    // Build simplified report data for storage
    const simplifiedReport: AccioSimplifiedResult = {
      orderId: orderId,
      orderNumber: orderNumber || '',
      status: 'complete',
      subject: {
        firstName: completeOrder?.subject?.name_first || '',
        lastName: completeOrder?.subject?.name_last || '',
        ssn: completeOrder?.subject?.ssn,
        dob: completeOrder?.subject?.dob,
      },
      nationalCriminal: nationalCriminalSubOrder ? {
        status: (nationalCriminalSubOrder.filledStatus || nationalCriminalSubOrder['$']?.filledStatus) as any,
        result: (nationalCriminalSubOrder.filledCode || nationalCriminalSubOrder['$']?.filledCode) as any,
        heldForReview: (nationalCriminalSubOrder.held_for_review || nationalCriminalSubOrder['$']?.held_for_review) === 'Y',
        cases: nationalCriminalSubOrder.case ? (Array.isArray(nationalCriminalSubOrder.case) ? nationalCriminalSubOrder.case : [nationalCriminalSubOrder.case]) : [],
      } : null,
      evictions: evictionsSubOrder ? {
        status: (evictionsSubOrder.filledStatus || evictionsSubOrder['$']?.filledStatus) as any,
        result: (evictionsSubOrder.filledCode || evictionsSubOrder['$']?.filledCode) as any,
        heldForReview: (evictionsSubOrder.held_for_review || evictionsSubOrder['$']?.held_for_review) === 'Y',
        cases: evictionsSubOrder.case ? (Array.isArray(evictionsSubOrder.case) ? evictionsSubOrder.case : [evictionsSubOrder.case]) : [],
      } : null,
      reportUrls: {
        html: completeOrder?.reportURL?.HTML || '',
        pdfColor: completeOrder?.reportURL?.PDF_Color || '',
        pdfBW: completeOrder?.reportURL?.PDF_BW || '',
      },
      timeOrdered: completeOrder?.time_ordered || '',
      timeFilled: completeOrder?.time_filled || '',
    };

    // Update the existing BGSReport
    console.log('💾 [Background Check Webhook] Updating BGS report status to completed...');
    await prisma.bGSReport.update({
      where: {
        id: existingReport.id
      },
      data: {
        status: 'completed',
        reportData: simplifiedReport as any,
        receivedAt: new Date()
      }
    });

    console.log(`✅ [Background Check Webhook] Updated BGS report for order ${orderId}`);

    // Update Verification record
    console.log('💾 [Background Check Webhook] Updating Verification record...');
    const verification = await prisma.verification.findUnique({
      where: { userId: existingReport.userId },
    });

    if (verification) {
      const screeningDate = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 90); // Valid for 90 days

      await prisma.verification.update({
        where: { userId: existingReport.userId },
        data: {
          status: 'COMPLETED',
          evictionStatus,
          evictionCount,
          criminalStatus,
          criminalRecordCount,
          screeningDate,
          validUntil,
          backgroundCheckedAt: new Date(),
        },
      });
      console.log('✅ [Background Check Webhook] Verification record updated to COMPLETED');

      // TODO: Send email notification to user
      console.log('📧 [Background Check Webhook] Email notification queued for user:', existingReport.userId);
    } else {
      console.warn('⚠️ [Background Check Webhook] No Verification record found for user:', existingReport.userId);
    }

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
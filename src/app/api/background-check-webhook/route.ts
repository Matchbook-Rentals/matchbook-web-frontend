import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';
import { parseStringPromise } from 'xml2js';
import { sendNotificationEmail } from '@/lib/send-notification-email';
import { fetchAndParseEvictionRecords } from '@/lib/accio-pdf-parser';
import type {
  AccioScreeningResults,
  AccioCompleteOrder,
  AccioSubOrder,
  AccioSimplifiedResult,
} from '@/types/accio';

// Accio credentials for PDF fetch
const ACCIO_CREDENTIALS = {
  account: process.env.ACCIO_ACCOUNT || 'matchbook',
  username: process.env.ACCIO_USERNAME || '',
  password: process.env.ACCIO_PASSWORD || '',
};

// Helper to return XML success response (Accio requires XML, not JSON)
function xmlSuccess(message: string = "Accepted"): NextResponse {
  return new NextResponse(`<XML>${message}</XML>`, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Helper to return XML error response
function xmlError(errorMessage: string, status: number = 400): NextResponse {
  return new NextResponse(
    `<response><error>${errorMessage}</error></response>`,
    { status, headers: { 'Content-Type': 'text/xml' } }
  );
}

// Helper to parse Accio date format (YYYYMMDD) to Date
function parseAccioDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.length !== 8) return null;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

// Helper to send eviction hit email notification
async function sendEvictionHitEmail(
  verificationId: string,
  firstName: string,
  lastName: string
): Promise<void> {
  try {
    const result = await sendNotificationEmail({
      to: 'tyler.bennett52@gmail.com',
      subject: `[MatchBook] Eviction Hit - ${firstName} ${lastName}`,
      emailData: {
        companyName: 'MatchBook',
        headerText: 'Eviction Record Found',
        contentTitle: 'Action Required',
        contentText: `Verification for ${firstName} ${lastName} has eviction hits. Please review in admin panel and enter eviction case details.`,
        buttonText: 'Review Now',
        buttonUrl: `https://matchbookrentals.com/admin/eviction-review/${verificationId}`,
        companyAddress: '3024 N 1400 E',
        companyCity: 'Ogden, UT',
        companyWebsite: 'matchbookrentals.com',
      }
    });
    if (result.success) {
      console.log('📧 [Background Check Webhook] Eviction hit email sent successfully');
    } else {
      console.error('📧 [Background Check Webhook] Failed to send eviction hit email:', result.error);
    }
  } catch (error) {
    console.error('📧 [Background Check Webhook] Error sending eviction hit email:', error);
  }
}

// Helper to send user completion email when background check is done
async function sendUserCompletionEmail(
  userEmail: string,
  firstName: string
): Promise<void> {
  try {
    const result = await sendNotificationEmail({
      to: userEmail,
      subject: 'Your MatchBook Background Check is Complete',
      emailData: {
        companyName: 'MatchBook',
        headerText: 'Background Check Complete',
        contentTitle: 'Your Verification is Ready',
        contentText: `Hi ${firstName}, your background check has been completed. You can now apply to rentals on MatchBook.`,
        buttonText: 'View My Verification',
        buttonUrl: 'https://matchbookrentals.com/app/rent/verification',
        companyAddress: '3024 N 1400 E',
        companyCity: 'Ogden, UT',
        companyWebsite: 'matchbookrentals.com',
      }
    });
    if (result.success) {
      console.log('📧 [Background Check Webhook] User completion email sent successfully');
    } else {
      console.error('📧 [Background Check Webhook] Failed to send user completion email:', result.error);
    }
  } catch (error) {
    console.error('📧 [Background Check Webhook] Error sending user completion email:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let xmlData = '';

  console.log('🔔 [Background Check Webhook] Received webhook request');

  // Verify Basic Authentication
  const authHeader = request.headers.get('authorization');
  console.log('🔐 [Background Check Webhook] Auth header present:', !!authHeader);

  if (authHeader) {
    const expectedUsername = process.env.ACCIO_USERNAME;
    const expectedPassword = process.env.ACCIO_PASSWORD;

    // Decode Basic auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    console.log('🔐 [Background Check Webhook] Auth username:', username);

    if (username !== expectedUsername || password !== expectedPassword) {
      console.error('❌ [Background Check Webhook] Invalid credentials');
      return xmlError("Unauthorized", 401);
    }
    console.log('✅ [Background Check Webhook] Authentication verified');
  } else {
    console.log('⚠️ [Background Check Webhook] No auth header - proceeding anyway for backwards compatibility');
  }

  // CRITICAL: Log the raw payload FIRST, before any other processing
  // This ensures we capture the response even if database operations fail
  try {
    xmlData = await request.text();
  } catch (readError) {
    console.error('❌ [Background Check Webhook] Failed to read request body:', readError);
    return xmlError("Failed to read request body");
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

    // Handle ScreeningResults completeOrder format (OCR - final results)
    if (parsedXml?.ScreeningResults?.completeOrder) {
      const completeOrders = Array.isArray(parsedXml.ScreeningResults.completeOrder)
        ? parsedXml.ScreeningResults.completeOrder
        : [parsedXml.ScreeningResults.completeOrder];

      completeOrder = completeOrders[0]; // Primary order for basic info

      console.log('📋 [Background Check Webhook] Found OCR (completeOrder) format - processing');
      console.log('📋 [Background Check Webhook] Number of completeOrders:', completeOrders.length);
      console.log('📋 [Background Check Webhook] Order number:', completeOrder.number);
      console.log('📋 [Background Check Webhook] Remote order ID:', completeOrder.remote_number);
      console.log('📋 [Background Check Webhook] Overall status:', completeOrder.status);
      console.log('📋 [Background Check Webhook] Report URL:', completeOrder.reportURL?.HTML);

      // Get the order ID - try from number first, then reference_number
      const orderNumber = completeOrder.number || completeOrders.find((o: any) => o.reference_number)?.reference_number;

      if (!orderNumber) {
        console.log('⚠️ [Background Check Webhook] OCR has no order number - acknowledging receipt');
        return xmlSuccess("OCR received - no order number");
      }

      // Find the BGSReport
      console.log('🔍 [Background Check Webhook] Looking up BGS report for OCR order:', orderNumber);
      const existingReport = await prisma.bGSReport.findFirst({
        where: { orderId: orderNumber },
        include: { user: true }
      });

      if (!existingReport) {
        console.log('⚠️ [Background Check Webhook] No BGS report found for OCR order:', orderNumber);
        return xmlSuccess("OCR received - no matching order");
      }

      console.log('✅ [Background Check Webhook] Found BGS report:', existingReport.id);

      // Get subject info for email
      const firstName = completeOrder.subject?.name_first || 'Unknown';
      const lastName = completeOrder.subject?.name_last || 'Unknown';

      // Collect all criminal cases and eviction status from all completeOrders
      const criminalCases: any[] = [];
      let evictionStatus = "No Records Found";
      let criminalStatus = "No Records Found";
      let evictionCount = 0;
      let criminalRecordCount = 0;
      let reportUrl = completeOrder.reportURL?.HTML || '';

      // Process all completeOrders to find subOrders with data
      for (const order of completeOrders) {
        const subOrders = order.subOrder
          ? (Array.isArray(order.subOrder) ? order.subOrder : [order.subOrder])
          : [];

        for (const subOrder of subOrders) {
          const subOrderType = subOrder.type || '';
          const filledCode = subOrder.filledCode || '';
          const heldForReview = subOrder.held_for_review || '';

          console.log('📋 [Background Check Webhook] Processing subOrder:', subOrderType, 'filledCode:', filledCode);

          // Handle County Criminal (contains case details)
          if (subOrderType === 'County_criminal' && filledCode === 'hits') {
            criminalStatus = heldForReview === 'Y' ? "Under Review" : "Records Found";

            // Extract case details
            const cases = subOrder.case
              ? (Array.isArray(subOrder.case) ? subOrder.case : [subOrder.case])
              : [];

            for (const caseData of cases) {
              criminalCases.push({
                caseNumber: caseData.case_number || '',
                filingDate: parseAccioDate(caseData.filing_date),
                dispositionDate: parseAccioDate(caseData.disposition_date),
                pendingDate: parseAccioDate(caseData.pending_date),
                jurisdiction: subOrder.county || caseData.jurisdiction || '',
                jurisdictionState: subOrder.state || caseData.jurisdiction_state || '',
                courtSource: caseData.source || '',
                charge: caseData.chargeinfo?.charge || '',
                chargeNumber: parseInt(caseData.chargeinfo?.charge_number) || 1,
                crimeType: caseData.chargeinfo?.crime_type || '',
                disposition: caseData.chargeinfo?.disposition || '',
                sentenceComments: caseData.chargeinfo?.sentence_comments || '',
                identifiedByName: caseData.identified_by_name === 'Y',
                identifiedByDob: caseData.identified_by_dob === 'Y',
                identifiedBySsn: caseData.identified_by_ssn === 'Y',
                rawData: caseData,
              });
            }
            criminalRecordCount = criminalCases.length;
            console.log('📋 [Background Check Webhook] Found', criminalCases.length, 'criminal cases');
          }

          // Handle National Criminal
          if ((subOrderType === 'National Criminal' || subOrderType === 'National Criminal2')) {
            if (filledCode === 'hits') {
              criminalStatus = heldForReview === 'Y' ? "Under Review" : "Records Found";
            } else if (filledCode === 'clear' && criminalStatus === "No Records Found") {
              criminalStatus = "No Records Found";
            }
          }

          // Handle Evictions
          if (subOrderType === 'evictions_check') {
            if (filledCode === 'hits') {
              evictionStatus = heldForReview === 'Y' ? "Under Review" : "Records Found";
              evictionCount = 1; // We don't get detailed eviction data in webhook
            } else if (filledCode === 'clear') {
              evictionStatus = "No Records Found";
            }
          }
        }
      }

      console.log('📋 [Background Check Webhook] Final OCR results:', {
        criminalStatus,
        criminalRecordCount,
        evictionStatus,
        evictionCount,
      });

      // Get or create Verification record
      let verification = await prisma.verification.findUnique({
        where: { userId: existingReport.userId },
      });

      if (!verification) {
        console.log('⚠️ [Background Check Webhook] No verification found for user, creating one');
        verification = await prisma.verification.create({
          data: {
            userId: existingReport.userId,
            status: 'PROCESSING_BGS',
          },
        });
      }

      // Determine review statuses
      const evictionReviewStatus = evictionStatus === "Records Found" ? "pending_review" : "not_applicable";
      const criminalReviewStatus = criminalCases.length > 0 ? "reviewed" : "not_applicable"; // Auto-reviewed since we have details

      // Update BGS Report
      await prisma.bGSReport.update({
        where: { id: existingReport.id },
        data: {
          status: 'completed',
          reportData: {
            status: 'complete',
            orderId: orderNumber,
            reportUrl,
            criminalStatus,
            criminalRecordCount,
            evictionStatus,
            evictionCount,
            receivedAt: new Date().toISOString(),
          } as any,
          receivedAt: new Date(),
        },
      });

      // Create criminal records in database
      if (criminalCases.length > 0) {
        console.log('💾 [Background Check Webhook] Creating', criminalCases.length, 'criminal records');
        await prisma.criminalRecord.createMany({
          data: criminalCases.map(c => ({
            verificationId: verification!.id,
            caseNumber: c.caseNumber,
            filingDate: c.filingDate,
            dispositionDate: c.dispositionDate,
            pendingDate: c.pendingDate,
            jurisdiction: c.jurisdiction,
            jurisdictionState: c.jurisdictionState,
            courtSource: c.courtSource,
            charge: c.charge,
            chargeNumber: c.chargeNumber,
            crimeType: c.crimeType,
            disposition: c.disposition,
            sentenceComments: c.sentenceComments,
            identifiedByName: c.identifiedByName,
            identifiedByDob: c.identifiedByDob,
            identifiedBySsn: c.identifiedBySsn,
            rawData: c.rawData,
          })),
        });
        console.log('✅ [Background Check Webhook] Criminal records created');
      }

      // Update Verification
      const screeningDate = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 90);

      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: 'COMPLETED',
          evictionStatus,
          evictionCount,
          criminalStatus,
          criminalRecordCount,
          evictionReviewStatus,
          criminalReviewStatus,
          screeningDate,
          validUntil,
          backgroundCheckedAt: new Date(),
          backgroundCheckCompletedAt: new Date(),
          bgsReportId: existingReport.id,
        },
      });
      console.log('✅ [Background Check Webhook] Verification updated to COMPLETED');

      // If eviction hits found, fetch PDF and parse eviction records
      if (evictionStatus === "Records Found") {
        console.log('📄 [Background Check Webhook] Eviction hits detected - fetching PDF for details');

        // Get the remote order ID for PDF fetch
        const remoteOrderId = completeOrder.remote_number;
        if (remoteOrderId && ACCIO_CREDENTIALS.username) {
          try {
            const pdfResult = await fetchAndParseEvictionRecords(remoteOrderId, ACCIO_CREDENTIALS);

            if (pdfResult.success && pdfResult.evictionRecords.length > 0) {
              console.log(`📄 [Background Check Webhook] Parsed ${pdfResult.evictionRecords.length} eviction records from PDF`);

              // Create eviction records in database (unverified - needs admin review)
              await prisma.evictionRecord.createMany({
                data: pdfResult.evictionRecords.map(record => ({
                  verificationId: verification!.id,
                  caseNumber: record.caseNumber,
                  filingDate: record.filingDate ? new Date(record.filingDate) : null,
                  dispositionDate: record.dispositionDate ? new Date(record.dispositionDate) : null,
                  plaintiff: record.plaintiff,
                  defendantAddress: record.defendantAddress,
                  judgmentAmount: record.judgmentAmount,
                  disposition: record.disposition,
                  court: record.court,
                  enteredBy: 'system-auto',
                  notes: 'Auto-extracted from PDF - pending verification',
                  verified: false,
                })),
              });

              // Update eviction count - keep pending_review for admin verification
              await prisma.verification.update({
                where: { id: verification!.id },
                data: {
                  evictionCount: pdfResult.evictionRecords.length,
                  evictionReviewStatus: 'pending_review',
                },
              });

              console.log('✅ [Background Check Webhook] Eviction records auto-extracted and saved');
            } else {
              console.log('⚠️ [Background Check Webhook] Could not parse eviction records from PDF:', pdfResult.error);
              // Keep pending_review status so admin can manually enter
            }
          } catch (pdfError) {
            console.error('❌ [Background Check Webhook] Error fetching/parsing eviction PDF:', pdfError);
            // Keep pending_review status so admin can manually enter
          }
        }

        // Still send admin email notification for eviction hits
        console.log('📧 [Background Check Webhook] Sending eviction notification email');
        await sendEvictionHitEmail(verification.id, firstName, lastName);
      } else {
        // No eviction hits - send user completion email immediately
        console.log('📧 [Background Check Webhook] No eviction hits - sending user completion email');
        const userEmail = existingReport.user?.email;
        if (userEmail) {
          await sendUserCompletionEmail(userEmail, firstName);
        }
      }

      return xmlSuccess("OCR processed");
    }
    // Handle ScreeningResults postResults format (ICR - incremental results) - logging only
    // We rely on OCR (completeOrder) for full processing, ICR is just for tracking progress
    else if (parsedXml?.ScreeningResults?.postResults) {
      const postResults = parsedXml.ScreeningResults.postResults;
      console.log('📋 [Background Check Webhook] ICR received (logging only - waiting for OCR)');
      console.log('📋 [Background Check Webhook] Order:', postResults.order);
      console.log('📋 [Background Check Webhook] Type:', postResults.type);
      console.log('📋 [Background Check Webhook] Status:', postResults.filledStatus, '/', postResults.filledCode);

      orderNumber = postResults.order;
      orderId = postResults.order;

      return xmlSuccess(`ICR logged - ${postResults.type}: ${postResults.filledCode}`);
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
      // Still return success to stop retries - we logged the data
      return xmlSuccess("Received - could not extract order ID");
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
      // Still return success to stop retries - we logged the data
      return xmlSuccess("Received - no matching order");
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
          // Audit fields - mark background check as completed
          backgroundCheckCompletedAt: new Date(),
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

    return xmlSuccess("Results processed");

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [Background Check Webhook] Error processing webhook:', error);
    console.error('   Error type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('⏱️ [Background Check Webhook] Failed after:', processingTime, 'ms');

    // Still return success to stop retries - we logged the data
    // Only return actual error if we want Accio to retry
    return xmlSuccess("Received with processing error - logged");
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
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    console.log('🔍 [Admin Check] Looking up BGS report for order:', orderId);

    const report = await prisma.bGSReport.findFirst({
      where: {
        orderId: orderId
      },
      include: {
        purchase: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            redeemed: true,
            createdAt: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!report) {
      console.log('❌ [Admin Check] No BGS report found for order:', orderId);
      return NextResponse.json(
        {
          found: false,
          error: `No BGS report found with order ID: ${orderId}`,
          message: "This order ID does not exist in the database. Make sure you have a BGSReport record with this exact order ID."
        },
        { status: 404 }
      );
    }

    console.log('✅ [Admin Check] Found BGS report:', {
      reportId: report.id,
      status: report.status,
      hasReportData: !!report.reportData,
      receivedAt: report.receivedAt,
    });

    return NextResponse.json({
      found: true,
      report: {
        id: report.id,
        orderId: report.orderId,
        status: report.status,
        createdAt: report.createdAt,
        receivedAt: report.receivedAt,
        hasReportData: !!report.reportData,
        reportDataPreview: report.reportData
          ? JSON.stringify(report.reportData).substring(0, 200) + '...'
          : null,
        fullReportData: report.reportData,
      },
      purchase: report.purchase,
      user: report.user,
    });

  } catch (error) {
    console.error('❌ [Admin Check] Error checking BGS report:', error);
    return NextResponse.json(
      {
        error: "Failed to check BGS report",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

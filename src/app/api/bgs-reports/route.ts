import { NextResponse } from "next/server";
import prisma from '@/lib/prismadb';

export async function GET() {
  try {
    const reports = await prisma.bGSReport.findMany({
      include: {
        purchase: {
          select: {
            id: true,
            email: true,
            amount: true,
            createdAt: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Manually fetch user data and handle null references
    const reportsWithUsers = await Promise.all(
      reports.map(async (report) => {
        let user = null;
        if (report.userId) {
          try {
            user = await prisma.user.findUnique({
              where: { id: report.userId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            });
          } catch (error) {
            console.warn(`Could not fetch user ${report.userId} for report ${report.id}`);
          }
        }
        
        return {
          ...report,
          user: user || {
            id: report.userId || 'unknown',
            firstName: 'Unknown',
            lastName: 'User',
            email: 'unknown@test.com'
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      reports: reportsWithUsers
    });
  } catch (error) {
    console.error('Error fetching BGS reports:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch BGS reports",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

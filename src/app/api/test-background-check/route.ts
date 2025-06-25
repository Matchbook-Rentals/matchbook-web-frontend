import { NextResponse } from "next/server";
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - must be logged in" },
        { status: 401 }
      );
    }
    
    // Parse request body for test data
    const body = await request.json();
    
    // Create an unredeemed background check purchase for testing
    const testPurchase = await prisma.purchase.create({
      data: {
        type: 'backgroundCheck',
        amount: 1099,
        userId: userId,
        email: `${userId}@test.com`,
        status: 'completed',
        isRedeemed: false,
        metadata: {
          test: true,
          createdAt: new Date().toISOString()
        },
      },
    });
    
    console.log(`Test purchase created: ${testPurchase.id} for user ${userId}`);

    // Call the background check API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/background-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Mock authentication header for testing
        "x-test-user-id": userId,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    // Fetch the updated purchase to see the orderId
    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: testPurchase.id }
    });

    return NextResponse.json({
      testData: body,
      testPurchaseId: testPurchase.id,
      apiResponse: result,
      statusCode: response.status,
      updatedPurchase: updatedPurchase,
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
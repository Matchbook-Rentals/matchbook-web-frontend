import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SaveTestCaseRequest {
  testCase: {
    name: string
    description: string
    inputData: {
      bookingId: string
      monthlyRent: number
      startDate: string
      endDate: string
      stripePaymentMethodId: string
    }
    expectedData: {
      expectedPayments: number
      expectedAmounts: number[]
    }
  }
  testSuiteName?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SaveTestCaseRequest = await request.json()
    const { testCase, testSuiteName = 'Payment Generation Tests' } = body

    // Find or create the test suite
    let testSuite = await prisma.testSuite.findFirst({
      where: {
        name: testSuiteName,
        category: 'payment-generation',
        createdBy: userId
      }
    })

    if (!testSuite) {
      testSuite = await prisma.testSuite.create({
        data: {
          name: testSuiteName,
          description: 'Test suite for payment generation functionality',
          category: 'payment-generation',
          createdBy: userId
        }
      })
    }

    // Check if test case with same name already exists
    const existingTestCase = await prisma.testCase.findFirst({
      where: {
        testSuiteId: testSuite.id,
        name: testCase.name
      }
    })

    if (existingTestCase) {
      return NextResponse.json({ 
        error: 'Test case with this name already exists in the suite' 
      }, { status: 400 })
    }

    // Create the test case
    const savedTestCase = await prisma.testCase.create({
      data: {
        testSuiteId: testSuite.id,
        name: testCase.name,
        description: testCase.description,
        inputData: testCase.inputData,
        expectedData: testCase.expectedData
      }
    })

    return NextResponse.json({ 
      success: true, 
      testCaseId: savedTestCase.id,
      testSuiteId: testSuite.id,
      message: 'Test case saved successfully'
    })

  } catch (error) {
    console.error('Error saving test case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
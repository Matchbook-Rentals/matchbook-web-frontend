'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { BrandButton } from '@/components/ui/brandButton'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar, DollarSign, TestTube } from 'lucide-react'

// Import the function we want to test
// Note: We'll need to create a client-side version since generateRentPayments is server-side
interface RentPayment {
  bookingId: string
  amount: number
  dueDate: Date
  stripePaymentMethodId: string
  paymentAuthorizedAt: Date | null
}

function generateRentPayments(
  bookingId: string,
  monthlyRent: number,
  startDate: Date,
  endDate: Date,
  stripePaymentMethodId: string
): RentPayment[] {
  const payments: RentPayment[] = []
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Start from the first of the month after start date (or same month if starts on 1st)
  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1)
  
  // If booking starts after the 1st, add a pro-rated payment for the partial month
  if (start.getDate() > 1) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const daysFromStart = daysInMonth - start.getDate() + 1
    const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth)
    
    payments.push({
      bookingId,
      amount: proRatedAmount,
      dueDate: start,
      stripePaymentMethodId,
      paymentAuthorizedAt: new Date(),
    })
    
    // Move to next month for regular payments
    currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  }
  
  // Generate monthly payments on the 1st of each month
  while (currentDate < end) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Check if this is the last month and we need pro-rating
    if (monthEnd >= end && end.getDate() > 1) {
      const daysInMonth = monthEnd.getDate()
      const daysToEnd = end.getDate() - 1 // Subtract 1 because end date is exclusive
      const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth)
      
      payments.push({
        bookingId,
        amount: proRatedAmount,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
      })
    } else {
      // Full month payment
      payments.push({
        bookingId,
        amount: monthlyRent,
        dueDate: currentDate,
        stripePaymentMethodId,
        paymentAuthorizedAt: null,
      })
    }
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  }
  
  return payments
}

interface TestResult {
  name: string
  passed: boolean
  expected: any
  actual: any
  message?: string
  testCaseName: string
}

interface TestCase {
  name: string
  bookingId: string
  monthlyRent: number
  startDate: Date
  endDate: Date
  stripePaymentMethodId: string
  expectedPayments: number
  expectedAmounts: number[]
  description: string
}

export default function TestPaymentCreation() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [runningTestCase, setRunningTestCase] = useState<string | null>(null)

  const testCases: TestCase[] = [
    {
      name: "Simple Year Lease (Jan 1 to Jan 1)",
      bookingId: "test-booking-1",
      monthlyRent: 2000,
      startDate: new Date(2024, 0, 1), // Jan 1, 2024
      endDate: new Date(2025, 0, 1), // Jan 1, 2025
      stripePaymentMethodId: "pm_test_123",
      expectedPayments: 12,
      expectedAmounts: [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000], // 12 full payments, move-out date doesn't count
      description: "1-year lease starting and ending on the 1st should have exactly 12 full payments, move-out date should not incur additional rent"
    }
  ]

  const runSingleTestCase = (testCase: TestCase) => {
    setRunningTestCase(testCase.name)
    const existingResults = testResults.filter(r => r.testCaseName !== testCase.name)
    const newResults: TestResult[] = []

    try {
      const payments = generateRentPayments(
        testCase.bookingId,
        testCase.monthlyRent,
        testCase.startDate,
        testCase.endDate,
        testCase.stripePaymentMethodId
      )

      // Test: Number of payments
      newResults.push({
        name: `Payment Count`,
        passed: payments.length === testCase.expectedPayments,
        expected: testCase.expectedPayments,
        actual: payments.length,
        message: `Expected ${testCase.expectedPayments} payments, got ${payments.length}`,
        testCaseName: testCase.name
      })

      // Test: Payment amounts
      const actualAmounts = payments.map(p => p.amount)
      const amountsMatch = JSON.stringify(actualAmounts) === JSON.stringify(testCase.expectedAmounts)
      newResults.push({
        name: `Payment Amounts`,
        passed: amountsMatch,
        expected: testCase.expectedAmounts,
        actual: actualAmounts,
        message: amountsMatch ? 'All amounts match expected values' : 'Payment amounts do not match expected values',
        testCaseName: testCase.name
      })

      // Test: All payments equal monthly rent (no pro-rating for move-out date)
      const allPaymentsEqual = actualAmounts.every(amount => amount === testCase.monthlyRent)
      newResults.push({
        name: `Payment Structure (All Equal Monthly Rent)`,
        passed: allPaymentsEqual,
        expected: `All payments should be ${testCase.monthlyRent}`,
        actual: actualAmounts,
        message: allPaymentsEqual ? 'All payments equal monthly rent' : 'Some payments differ from monthly rent',
        testCaseName: testCase.name
      })

      // Test: First payment date
      const firstPayment = payments[0]
      const expectedFirstDate = new Date(2024, 0, 1)
      const firstDateCorrect = firstPayment.dueDate.getTime() === expectedFirstDate.getTime()
      newResults.push({
        name: `First Payment Date`,
        passed: firstDateCorrect,
        expected: expectedFirstDate.toDateString(),
        actual: firstPayment.dueDate.toDateString(),
        message: firstDateCorrect ? 'First payment date is correct' : 'First payment date is incorrect',
        testCaseName: testCase.name
      })

      // Test: Last payment date
      const lastPayment = payments[payments.length - 1]
      const expectedLastDate = new Date(2024, 11, 1) // Dec 1, 2024 (last payment before move-out)
      const lastDateCorrect = lastPayment.dueDate.getTime() === expectedLastDate.getTime()
      newResults.push({
        name: `Last Payment Date`,
        passed: lastDateCorrect,
        expected: expectedLastDate.toDateString(),
        actual: lastPayment.dueDate.toDateString(),
        message: lastDateCorrect ? 'Last payment date is correct' : 'Last payment date is incorrect',
        testCaseName: testCase.name
      })

    } catch (error) {
      newResults.push({
        name: `Error`,
        passed: false,
        expected: 'No error',
        actual: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test threw an error',
        testCaseName: testCase.name
      })
    }

    setTestResults([...existingResults, ...newResults])
    setRunningTestCase(null)
  }

  const runAllTests = () => {
    setIsRunning(true)
    const results: TestResult[] = []

    testCases.forEach(testCase => {
      try {
        const payments = generateRentPayments(
          testCase.bookingId,
          testCase.monthlyRent,
          testCase.startDate,
          testCase.endDate,
          testCase.stripePaymentMethodId
        )

        // Test: Number of payments
        results.push({
          name: `Payment Count`,
          passed: payments.length === testCase.expectedPayments,
          expected: testCase.expectedPayments,
          actual: payments.length,
          message: `Expected ${testCase.expectedPayments} payments, got ${payments.length}`,
          testCaseName: testCase.name
        })

        // Test: Payment amounts
        const actualAmounts = payments.map(p => p.amount)
        const amountsMatch = JSON.stringify(actualAmounts) === JSON.stringify(testCase.expectedAmounts)
        results.push({
          name: `Payment Amounts`,
          passed: amountsMatch,
          expected: testCase.expectedAmounts,
          actual: actualAmounts,
          message: amountsMatch ? 'All amounts match expected values' : 'Payment amounts do not match expected values',
          testCaseName: testCase.name
        })

        // Test: All payments equal monthly rent (no pro-rating for move-out date)
        const allPaymentsEqual = actualAmounts.every(amount => amount === testCase.monthlyRent)
        results.push({
          name: `Payment Structure (All Equal Monthly Rent)`,
          passed: allPaymentsEqual,
          expected: `All payments should be ${testCase.monthlyRent}`,
          actual: actualAmounts,
          message: allPaymentsEqual ? 'All payments equal monthly rent' : 'Some payments differ from monthly rent',
          testCaseName: testCase.name
        })

        // Test: First payment date
        const firstPayment = payments[0]
        const expectedFirstDate = new Date(2024, 0, 1)
        const firstDateCorrect = firstPayment.dueDate.getTime() === expectedFirstDate.getTime()
        results.push({
          name: `First Payment Date`,
          passed: firstDateCorrect,
          expected: expectedFirstDate.toDateString(),
          actual: firstPayment.dueDate.toDateString(),
          message: firstDateCorrect ? 'First payment date is correct' : 'First payment date is incorrect',
          testCaseName: testCase.name
        })

        // Test: Last payment date
        const lastPayment = payments[payments.length - 1]
        const expectedLastDate = new Date(2024, 11, 1) // Dec 1, 2024 (last payment before move-out)
        const lastDateCorrect = lastPayment.dueDate.getTime() === expectedLastDate.getTime()
        results.push({
          name: `Last Payment Date`,
          passed: lastDateCorrect,
          expected: expectedLastDate.toDateString(),
          actual: lastPayment.dueDate.toDateString(),
          message: lastDateCorrect ? 'Last payment date is correct' : 'Last payment date is incorrect',
          testCaseName: testCase.name
        })

      } catch (error) {
        results.push({
          name: `Error`,
          passed: false,
          expected: 'No error',
          actual: error instanceof Error ? error.message : 'Unknown error',
          message: 'Test threw an error',
          testCaseName: testCase.name
        })
      }
    })

    setTestResults(results)
    setIsRunning(false)
  }

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  // Group test results by test case
  const groupedResults = testResults.reduce((acc, result) => {
    if (!acc[result.testCaseName]) {
      acc[result.testCaseName] = []
    }
    acc[result.testCaseName].push(result)
    return acc
  }, {} as Record<string, TestResult[]>)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-primary" />
            <CardTitle>Payment Generation Test Suite</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Testing the generateRentPayments function with various scenarios
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test Cases Overview with Individual Run Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Suites</h3>
            <Accordion type="single" collapsible className="w-full">
              {testCases.map((testCase, index) => {
                const testCaseResults = testResults.filter(r => r.testCaseName === testCase.name)
                const testCasePassed = testCaseResults.length > 0 ? testCaseResults.every(r => r.passed) : null
                const testCasePassedCount = testCaseResults.filter(r => r.passed).length
                const hasResults = testCaseResults.length > 0
                
                return (
                  <AccordionItem key={index} value={testCase.name}>
                    <AccordionTrigger className={`border-l-4 pl-4 ${
                      testCasePassed === null ? 'border-l-gray-400' : 
                      testCasePassed ? 'border-l-green-500' : 'border-l-red-500'
                    }`}>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {hasResults && (
                            <Badge variant={testCasePassed ? "default" : "destructive"}>
                              {testCasePassed ? 'PASS' : 'FAIL'}
                            </Badge>
                          )}
                          <span className="font-medium">{testCase.name}</span>
                          {hasResults && (
                            <Badge variant="outline">
                              {testCasePassedCount}/{testCaseResults.length}
                            </Badge>
                          )}
                        </div>
                        <BrandButton 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent accordion toggle
                            runSingleTestCase(testCase)
                          }}
                          disabled={runningTestCase === testCase.name}
                          className="shrink-0"
                        >
                          {runningTestCase === testCase.name ? 'Running...' : hasResults ? 'Re-run' : 'Run Test'}
                        </BrandButton>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        {/* Test Case Details */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-muted-foreground text-sm mb-3">{testCase.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {testCase.startDate.toDateString()} to {testCase.endDate.toDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${testCase.monthlyRent}/month
                            </div>
                          </div>
                        </div>


                        {/* Test Results for this Test Case */}
                        {testCaseResults.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Test Results:</h4>
                            {testCaseResults.map((result, resultIndex) => (
                              <Card key={resultIndex} className={`border-l-4 ${result.passed ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={result.passed ? "default" : "destructive"} size="sm">
                                          {result.passed ? 'PASS' : 'FAIL'}
                                        </Badge>
                                        <span className="font-medium">{result.name}</span>
                                      </div>
                                      {result.message && (
                                        <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                                      )}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Expected:</span>
                                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                            {typeof result.expected === 'object' ? JSON.stringify(result.expected, null, 2) : result.expected}
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="font-medium">Actual:</span>
                                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                            {typeof result.actual === 'object' ? JSON.stringify(result.actual, null, 2) : result.actual}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          {/* Run All Tests Button */}
          <div className="text-center">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning || runningTestCase !== null}
              size="lg"
              className="min-w-[200px]"
            >
              {isRunning ? 'Running All Tests...' : 'Run All Test Suites'}
            </Button>
          </div>

          {/* Overall Summary */}
          {testResults.length > 0 && (
            <div className="text-center">
              <div className="flex justify-center">
                <Badge variant={passedTests === totalTests ? "default" : "destructive"} className="text-lg px-4 py-2">
                  Overall: {passedTests}/{totalTests} Tests Passed
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
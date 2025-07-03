'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { BrandButton } from '@/components/ui/brandButton'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, DollarSign, TestTube, Plus, Loader2, Edit, Save, FileUp } from 'lucide-react'

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
  isUnsaved?: boolean
  testCaseId?: string
}

export default function TestPaymentCreation() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [runningTestCase, setRunningTestCase] = useState<string | null>(null)
  const [isAddTestDialogOpen, setIsAddTestDialogOpen] = useState(false)
  const [isEditTestDialogOpen, setIsEditTestDialogOpen] = useState(false)
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false)
  const [isGeneratingTest, setIsGeneratingTest] = useState(false)
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null)
  const [savingTestIndex, setSavingTestIndex] = useState<number | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isProcessingCsv, setIsProcessingCsv] = useState(false)
  const [newTestForm, setNewTestForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    monthlyRent: ''
  })
  const [editTestForm, setEditTestForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    explanation: ''
  })

  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      name: "Simple Year Lease (Jan 1 to Jan 1)",
      bookingId: "test-booking-1",
      monthlyRent: 2000,
      startDate: new Date(2024, 0, 1), // Jan 1, 2024
      endDate: new Date(2025, 0, 1), // Jan 1, 2025
      stripePaymentMethodId: "pm_test_123",
      expectedPayments: 12,
      expectedAmounts: [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000], // 12 full payments, move-out date doesn't count
      description: "1-year lease starting and ending on the 1st should have exactly 12 full payments, move-out date should not incur additional rent",
      isUnsaved: false // This is the original example test case
    }
  ])

  const handleAddTestCase = async () => {
    if (!newTestForm.title || !newTestForm.startDate || !newTestForm.endDate || !newTestForm.monthlyRent) {
      alert('Please fill in all required fields')
      return
    }

    setIsGeneratingTest(true)
    
    try {
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTestForm.title,
          description: newTestForm.description,
          startDate: newTestForm.startDate,
          endDate: newTestForm.endDate,
          monthlyRent: parseInt(newTestForm.monthlyRent)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate test case')
      }

      const generatedTest = await response.json()
      
      // Validate the response structure
      if (!generatedTest.inputData || !generatedTest.expectedData || !generatedTest.testName) {
        throw new Error('Invalid test case structure received from AI')
      }
      
      // Convert generated test to TestCase format
      const newTestCase: TestCase = {
        name: generatedTest.testName,
        bookingId: generatedTest.inputData.bookingId,
        monthlyRent: generatedTest.inputData.monthlyRent,
        startDate: new Date(generatedTest.inputData.startDate),
        endDate: new Date(generatedTest.inputData.endDate),
        stripePaymentMethodId: generatedTest.inputData.stripePaymentMethodId,
        expectedPayments: generatedTest.expectedData.expectedPayments,
        expectedAmounts: generatedTest.expectedData.expectedAmounts,
        description: generatedTest.testDescription,
        isUnsaved: true // Mark as unsaved since it's newly generated
      }

      setTestCases(prev => [...prev, newTestCase])
      setIsAddTestDialogOpen(false)
      setNewTestForm({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        monthlyRent: ''
      })
      
    } catch (error) {
      console.error('Error generating test case:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to generate test case: ${errorMessage}\n\nPlease try again with different parameters.`)
    } finally {
      setIsGeneratingTest(false)
    }
  }

  const handleEditTestCase = (index: number) => {
    const testCase = testCases[index]
    setEditingTestIndex(index)
    setEditTestForm({
      title: testCase.name,
      description: testCase.description,
      startDate: testCase.startDate.toISOString().split('T')[0],
      endDate: testCase.endDate.toISOString().split('T')[0],
      monthlyRent: testCase.monthlyRent.toString(),
      explanation: ''
    })
    setIsEditTestDialogOpen(true)
  }

  const handleSaveEditedTestCase = async () => {
    if (!editTestForm.title || !editTestForm.startDate || !editTestForm.endDate || !editTestForm.monthlyRent || !editTestForm.explanation) {
      alert('Please fill in all required fields including the explanation')
      return
    }

    if (editingTestIndex === null) return

    setIsGeneratingTest(true)
    
    try {
      const originalTestCase = testCases[editingTestIndex]
      
      const response = await fetch('/api/test-cases/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTestForm.title,
          description: editTestForm.description,
          startDate: editTestForm.startDate,
          endDate: editTestForm.endDate,
          monthlyRent: parseInt(editTestForm.monthlyRent),
          explanation: editTestForm.explanation,
          originalTestCase: {
            name: originalTestCase.name,
            bookingId: originalTestCase.bookingId,
            monthlyRent: originalTestCase.monthlyRent,
            startDate: originalTestCase.startDate.toISOString().split('T')[0],
            endDate: originalTestCase.endDate.toISOString().split('T')[0],
            stripePaymentMethodId: originalTestCase.stripePaymentMethodId,
            expectedPayments: originalTestCase.expectedPayments,
            expectedAmounts: originalTestCase.expectedAmounts,
            description: originalTestCase.description
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update test case')
      }

      const updatedTest = await response.json()
      
      // Validate the response structure
      if (!updatedTest.inputData || !updatedTest.expectedData || !updatedTest.testName) {
        throw new Error('Invalid test case structure received from AI')
      }
      
      // Convert updated test to TestCase format
      const updatedTestCase: TestCase = {
        name: updatedTest.testName,
        bookingId: updatedTest.inputData.bookingId,
        monthlyRent: updatedTest.inputData.monthlyRent,
        startDate: new Date(updatedTest.inputData.startDate),
        endDate: new Date(updatedTest.inputData.endDate),
        stripePaymentMethodId: updatedTest.inputData.stripePaymentMethodId,
        expectedPayments: updatedTest.expectedData.expectedPayments,
        expectedAmounts: updatedTest.expectedData.expectedAmounts,
        description: updatedTest.testDescription,
        isUnsaved: true // Mark as unsaved since it's been modified
      }

      // Update the test case in the array
      setTestCases(prev => {
        const newTestCases = [...prev]
        newTestCases[editingTestIndex] = updatedTestCase
        return newTestCases
      })

      // Clear test results for the updated test case
      setTestResults(prev => prev.filter(r => r.testCaseName !== originalTestCase.name))
      
      setIsEditTestDialogOpen(false)
      setEditingTestIndex(null)
      setEditTestForm({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        explanation: ''
      })
      
    } catch (error) {
      console.error('Error updating test case:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update test case: ${errorMessage}\n\nPlease check your explanation and try again.`)
    } finally {
      setIsGeneratingTest(false)
    }
  }

  const handleSaveTestCase = async (index: number) => {
    const testCase = testCases[index]
    
    if (!testCase.isUnsaved) return // Already saved
    
    setSavingTestIndex(index)
    
    try {
      const response = await fetch('/api/test-cases/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testCase: {
            name: testCase.name,
            description: testCase.description,
            inputData: {
              bookingId: testCase.bookingId,
              monthlyRent: testCase.monthlyRent,
              startDate: testCase.startDate.toISOString().split('T')[0],
              endDate: testCase.endDate.toISOString().split('T')[0],
              stripePaymentMethodId: testCase.stripePaymentMethodId
            },
            expectedData: {
              expectedPayments: testCase.expectedPayments,
              expectedAmounts: testCase.expectedAmounts
            }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save test case')
      }

      const saveResult = await response.json()
      
      // Update the test case to mark it as saved
      setTestCases(prev => {
        const newTestCases = [...prev]
        newTestCases[index] = {
          ...newTestCases[index],
          isUnsaved: false,
          testCaseId: saveResult.testCaseId
        }
        return newTestCases
      })
      
    } catch (error) {
      console.error('Error saving test case:', error)
      alert(`Failed to save test case: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSavingTestIndex(null)
    }
  }

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }

    setIsProcessingCsv(true)
    
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      
      const response = await fetch('/api/test-cases/import-csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to process CSV file')
      }

      const result = await response.json()
      
      if (result.testCases && result.testCases.length > 0) {
        // Convert generated test cases to TestCase format
        const newTestCases: TestCase[] = result.testCases.map((tc: any) => ({
          name: tc.testName,
          bookingId: tc.inputData.bookingId,
          monthlyRent: tc.inputData.monthlyRent,
          startDate: new Date(tc.inputData.startDate),
          endDate: new Date(tc.inputData.endDate),
          stripePaymentMethodId: tc.inputData.stripePaymentMethodId,
          expectedPayments: tc.expectedData.expectedPayments,
          expectedAmounts: tc.expectedData.expectedAmounts,
          description: tc.testDescription,
          isUnsaved: true // Mark as unsaved since they're newly generated
        }))
        
        setTestCases(prev => [...prev, ...newTestCases])
        
        // Show summary
        let message = `Successfully imported ${result.successfulCount} test case(s)`
        if (result.failedCount > 0) {
          message += `\n\nFailed to process ${result.failedCount} test case(s):`
          if (result.errors) {
            result.errors.forEach((err: any) => {
              message += `\n- ${err.title}: ${err.error}`
            })
          }
        }
        alert(message)
        
        setIsCsvImportDialogOpen(false)
        setCsvFile(null)
      } else {
        throw new Error('No test cases were successfully generated')
      }
      
    } catch (error) {
      console.error('Error importing CSV:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to import CSV: ${errorMessage}`)
    } finally {
      setIsProcessingCsv(false)
    }
  }

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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Suites</h3>
              <div className="flex gap-2">
                <Dialog open={isCsvImportDialogOpen} onOpenChange={setIsCsvImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      Import CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Import Test Cases from CSV</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="csv-file">CSV File</Label>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                          CSV must have columns: title, startDate, endDate, monthlyRent (optional: description)
                        </p>
                      </div>
                      {csvFile && (
                        <div className="text-sm text-muted-foreground">
                          Selected: {csvFile.name}
                        </div>
                      )}
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium mb-2">Example CSV format:</p>
                        <pre className="text-xs overflow-x-auto">
{`title,startDate,endDate,monthlyRent,description
"6 Month Lease",2024-01-01,2024-07-01,2000,"Standard 6 month lease"
"Mid-month start",2024-03-15,2024-09-15,1500,"Starts mid-month"
"Year lease",2024-01-01,2025-01-01,2500,"Full year lease"`}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 text-xs"
                          onClick={() => {
                            const csvContent = `title,startDate,endDate,monthlyRent,description
"6 Month Lease",2024-01-01,2024-07-01,2000,"Standard 6 month lease"
"Mid-month start",2024-03-15,2024-09-15,1500,"Starts mid-month"
"Year lease",2024-01-01,2025-01-01,2500,"Full year lease"
"Short term",2024-06-01,2024-09-01,1800,"3 month summer rental"
"Academic year",2024-08-15,2025-05-15,2200,"9 month academic lease"`
                            const blob = new Blob([csvContent], { type: 'text/csv' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'test-cases-template.csv'
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          Download Template CSV
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCsvImportDialogOpen(false)
                          setCsvFile(null)
                        }}
                        disabled={isProcessingCsv}
                      >
                        Cancel
                      </Button>
                      <BrandButton
                        onClick={handleCsvImport}
                        disabled={!csvFile || isProcessingCsv}
                        className="flex items-center gap-2"
                      >
                        {isProcessingCsv && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isProcessingCsv ? 'Processing...' : 'Import'}
                      </BrandButton>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddTestDialogOpen} onOpenChange={setIsAddTestDialogOpen}>
                  <DialogTrigger asChild>
                    <BrandButton size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Test Case
                    </BrandButton>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Test Case</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newTestForm.title}
                        onChange={(e) => setNewTestForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Mid-month lease with pro-rating"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTestForm.description}
                        onChange={(e) => setNewTestForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description of the test scenario"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newTestForm.startDate}
                          onChange={(e) => setNewTestForm(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newTestForm.endDate}
                          onChange={(e) => setNewTestForm(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthlyRent">Monthly Rent *</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        value={newTestForm.monthlyRent}
                        onChange={(e) => setNewTestForm(prev => ({ ...prev, monthlyRent: e.target.value }))}
                        placeholder="e.g., 2000"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddTestDialogOpen(false)}
                      disabled={isGeneratingTest}
                    >
                      Cancel
                    </Button>
                    <BrandButton
                      onClick={handleAddTestCase}
                      disabled={isGeneratingTest}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingTest && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isGeneratingTest ? 'Generating...' : 'Generate Test Case'}
                    </BrandButton>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
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
                          {testCase.isUnsaved && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                              Unsaved
                            </Badge>
                          )}
                          {hasResults && (
                            <Badge variant="outline">
                              {testCasePassedCount}/{testCaseResults.length}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {testCase.isUnsaved && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent accordion toggle
                                handleSaveTestCase(index)
                              }}
                              disabled={savingTestIndex === index}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                            >
                              {savingTestIndex === index ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              {savingTestIndex === index ? 'Saving...' : 'Save'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent accordion toggle
                              handleEditTestCase(index)
                            }}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <BrandButton 
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent accordion toggle
                              runSingleTestCase(testCase)
                            }}
                            disabled={runningTestCase === testCase.name}
                          >
                            {runningTestCase === testCase.name ? 'Running...' : hasResults ? 'Re-run' : 'Run Test'}
                          </BrandButton>
                        </div>
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

      {/* Edit Test Case Dialog */}
      <Dialog open={isEditTestDialogOpen} onOpenChange={setIsEditTestDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTestForm.title}
                onChange={(e) => setEditTestForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mid-month lease with pro-rating"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editTestForm.description}
                onChange={(e) => setEditTestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the test scenario"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editTestForm.startDate}
                  onChange={(e) => setEditTestForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editTestForm.endDate}
                  onChange={(e) => setEditTestForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-monthlyRent">Monthly Rent *</Label>
              <Input
                id="edit-monthlyRent"
                type="number"
                value={editTestForm.monthlyRent}
                onChange={(e) => setEditTestForm(prev => ({ ...prev, monthlyRent: e.target.value }))}
                placeholder="e.g., 2000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-explanation">Explanation of Changes/Issues *</Label>
              <Textarea
                id="edit-explanation"
                value={editTestForm.explanation}
                onChange={(e) => setEditTestForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Describe what you want to change or any error you encountered with this test case..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Explain what changes you want to make or describe any issues you found with the current test case. This helps the AI generate more accurate expectations.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTestDialogOpen(false)
                setEditingTestIndex(null)
                setEditTestForm({
                  title: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  monthlyRent: '',
                  explanation: ''
                })
              }}
              disabled={isGeneratingTest}
            >
              Cancel
            </Button>
            <BrandButton
              onClick={handleSaveEditedTestCase}
              disabled={isGeneratingTest}
              className="flex items-center gap-2"
            >
              {isGeneratingTest && <Loader2 className="h-4 w-4 animate-spin" />}
              {isGeneratingTest ? 'Updating...' : 'Update Test Case'}
            </BrandButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
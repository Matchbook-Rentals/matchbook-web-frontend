import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface CsvRow {
  title: string
  description?: string
  startDate: string
  endDate: string
  monthlyRent: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read and parse CSV
    const text = await file.text()
    const rows = text.split('\n').filter(row => row.trim())
    
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV file must have a header row and at least one data row' }, { status: 400 })
    }

    // Parse header
    const header = rows[0].split(',').map(h => h.trim().toLowerCase())
    const requiredColumns = ['title', 'startdate', 'enddate', 'monthlyrent']
    
    const columnIndices: Record<string, number> = {}
    requiredColumns.forEach(col => {
      const index = header.findIndex(h => h.replace(/[\s_-]/g, '') === col.replace(/[\s_-]/g, ''))
      if (index === -1) {
        throw new Error(`Missing required column: ${col}`)
      }
      columnIndices[col] = index
    })
    
    // Optional description column
    const descriptionIndex = header.findIndex(h => h.includes('description'))
    
    // Parse data rows
    const testCases: CsvRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue
      
      // Simple CSV parsing (handles quoted values)
      const values = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim())
      
      if (cleanValues.length < Object.keys(columnIndices).length) {
        console.warn(`Skipping invalid row ${i + 1}: insufficient columns`)
        continue
      }
      
      testCases.push({
        title: cleanValues[columnIndices.title],
        description: descriptionIndex >= 0 ? cleanValues[descriptionIndex] : undefined,
        startDate: cleanValues[columnIndices.startdate],
        endDate: cleanValues[columnIndices.enddate],
        monthlyRent: cleanValues[columnIndices.monthlyrent]
      })
    }

    if (testCases.length === 0) {
      return NextResponse.json({ error: 'No valid test cases found in CSV' }, { status: 400 })
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // The actual function implementation
    const generateRentPaymentsFunctionCode = `
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
}`

    // Process test cases in batches to avoid API limits
    const batchSize = 5
    const generatedTestCases = []
    
    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize)
      
      // Generate test cases for this batch
      const batchPromises = batch.map(async (testCase, index) => {
        const prompt = `TASK: Generate test case for rental payment calculation.

FUNCTION CODE:
${generateRentPaymentsFunctionCode}

TEST CASE #${i + index + 1}:
- Title: ${testCase.title}
- Start: ${testCase.startDate}
- End: ${testCase.endDate}
- Monthly Rent: $${testCase.monthlyRent}

CRITICAL RULES:
1. End date is EXCLUSIVE
2. Pro-rate partial months with Math.round()
3. Payments on 1st of each month

OUTPUT FORMAT (JSON only):
{
  "inputData": {
    "bookingId": "test-booking-${i + index + 2}",
    "monthlyRent": ${parseInt(testCase.monthlyRent)},
    "startDate": "${testCase.startDate}",
    "endDate": "${testCase.endDate}",
    "stripePaymentMethodId": "pm_test_123"
  },
  "expectedData": {
    "expectedPayments": [NUMBER],
    "expectedAmounts": [ARRAY]
  },
  "testName": "${testCase.title}",
  "testDescription": "${testCase.description || 'CSV imported test case'}"
}`

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 1024,
                stopSequences: ["```", "EXPLANATION:", "NOTE:"]
              }
            })
          })

          if (!response.ok) {
            throw new Error(`Gemini API error for test case "${testCase.title}"`)
          }

          const geminiData = await response.json()
          let generatedText = geminiData.candidates[0].content.parts[0].text
          
          // Clean up response
          generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const jsonStart = generatedText.indexOf('{')
          const jsonEnd = generatedText.lastIndexOf('}')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            generatedText = generatedText.substring(jsonStart, jsonEnd + 1)
          }
          
          const parsedTestCase = JSON.parse(generatedText)
          return { success: true, testCase: parsedTestCase }
        } catch (error) {
          console.error(`Error processing test case "${testCase.title}":`, error)
          return { 
            success: false, 
            testCase: null, 
            error: error instanceof Error ? error.message : 'Unknown error',
            title: testCase.title 
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      generatedTestCases.push(...batchResults)
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < testCases.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Separate successful and failed test cases
    const successful = generatedTestCases.filter(r => r.success).map(r => r.testCase)
    const failed = generatedTestCases.filter(r => !r.success)

    return NextResponse.json({
      success: true,
      totalProcessed: testCases.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      testCases: successful,
      errors: failed.length > 0 ? failed.map(f => ({ title: f.title, error: f.error })) : undefined
    })

  } catch (error) {
    console.error('Error processing CSV:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process CSV file' 
    }, { status: 500 })
  }
}
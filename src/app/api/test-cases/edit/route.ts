import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface EditTestCaseRequest {
  title: string
  description: string
  startDate: string
  endDate: string
  monthlyRent: number
  explanation: string
  originalTestCase: {
    name: string
    bookingId: string
    monthlyRent: number
    startDate: string
    endDate: string
    stripePaymentMethodId: string
    expectedPayments: number
    expectedAmounts: number[]
    description: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: EditTestCaseRequest = await request.json()
    const { title, description, startDate, endDate, monthlyRent, explanation, originalTestCase } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !monthlyRent || !explanation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const prompt = `TASK: Update a test case for rental payment calculation function.

FUNCTION CODE:
${generateRentPaymentsFunctionCode}

ORIGINAL TEST CASE:
${JSON.stringify(originalTestCase, null, 2)}

REQUESTED CHANGES:
- Title: ${title}
- Start: ${startDate}
- End: ${endDate}
- Monthly Rent: $${monthlyRent}
- Reason: ${explanation}

CRITICAL FUNCTION BEHAVIOR:
1. Payments on 1st of each month
2. Pro-rated partial months using Math.round()
3. End date is EXCLUSIVE
4. Formula: Math.round((monthlyRent * days) / daysInMonth)

REQUIRED OUTPUT (JSON only, no explanation):
{
  "inputData": {
    "bookingId": "test-booking-updated",
    "monthlyRent": ${monthlyRent},
    "startDate": "${startDate}",
    "endDate": "${endDate}",
    "stripePaymentMethodId": "pm_test_123"
  },
  "expectedData": {
    "expectedPayments": [NUMBER],
    "expectedAmounts": [ARRAY_OF_NUMBERS]
  },
  "testName": "${title}",
  "testDescription": "[BRIEF_DESCRIPTION_OF_CHANGES]"
}`

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
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

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text())
      return NextResponse.json({ error: 'Failed to generate updated test case' }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      return NextResponse.json({ error: 'Invalid response from Gemini' }, { status: 500 })
    }

    let generatedText = geminiData.candidates[0].content.parts[0].text
    
    console.log('Raw Gemini edit response:', generatedText)
    
    // Clean up the response to extract JSON
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Remove any text before the first {
    const jsonStart = generatedText.indexOf('{')
    if (jsonStart > 0) {
      generatedText = generatedText.substring(jsonStart)
    }
    
    // Remove any text after the last }
    const jsonEnd = generatedText.lastIndexOf('}')
    if (jsonEnd > 0) {
      generatedText = generatedText.substring(0, jsonEnd + 1)
    }
    
    try {
      const testCaseData = JSON.parse(generatedText)
      
      // Validate required fields
      if (!testCaseData.inputData || !testCaseData.expectedData || !testCaseData.testName) {
        throw new Error('Missing required fields in updated test case')
      }
      
      // Validate expectedAmounts is an array of numbers
      if (!Array.isArray(testCaseData.expectedData.expectedAmounts) || 
          !testCaseData.expectedData.expectedAmounts.every(amount => typeof amount === 'number')) {
        throw new Error('Invalid expectedAmounts format')
      }
      
      return NextResponse.json(testCaseData)
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError)
      console.error('Cleaned response:', generatedText)
      return NextResponse.json({ 
        error: 'Failed to parse updated test case',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        rawResponse: generatedText.substring(0, 500) // First 500 chars for debugging
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error editing test case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
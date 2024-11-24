
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('📨 Newsletter subscription request received')
  try {
    const body = await request.json()
    const { email, phone, countryCode } = body
    console.log('Request Body:', body)
    console.log('📝 Subscription details:', {
      email,
      phone: countryCode + phone
    })

    if (!email) {
      console.log('❌ Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Email, first name and last name are required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || ''
      },
      body: JSON.stringify({
        email,
        attributes: phone && countryCode ? {
          SMS: countryCode + phone,
        } : {},
        emailBlacklisted: false,
        smsBlacklisted: false,
        updateEnabled: false
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.log('❌ Brevo API error:', error)
      return NextResponse.json(
        {
          error: error || 'Failed to subscribe',
        },
        { status: response.status }
      )
    }

    console.log('✅ Successfully subscribed user to newsletter')
    return NextResponse.json(
      { message: 'Successfully subscribed' },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Unexpected error in subscription endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Twilio SMS Service
 *
 * Wrapper around Twilio SDK for sending SMS messages
 * Handles validation, rate limiting, and error handling
 */
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
};

/**
 * Validate phone number in E.164 format (+1234567890)
 */
const validateE164 = (phoneNumber: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

/**
 * Format phone number to E.164
 * Accepts: "555-123-4567", "(555) 123-4567", "5551234567"
 * Returns: "+15551234567"
 */
export const formatToE164 = (phoneNumber: string, countryCode: string = '+1'): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If starts with country code, keep it
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }

  // Otherwise, add country code
  return `${countryCode}${digits}`;
};

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate phone number format
    if (!validateE164(to)) {
      return {
        success: false,
        error: `Invalid phone number format: ${to}. Must be E.164 format (+1234567890)`
      };
    }

    // Validate from number
    if (!fromNumber) {
      return {
        success: false,
        error: 'TWILIO_PHONE_NUMBER not configured'
      };
    }

    // Validate message length (Twilio limit is 1600 chars, we'll use 1500 to be safe)
    if (message.length > 1500) {
      return {
        success: false,
        error: `Message too long: ${message.length} chars (max 1500)`
      };
    }

    const client = getTwilioClient();

    // Send message
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    console.log(`✅ SMS sent successfully: ${result.sid}`);
    console.log(`   To: ${to}`);
    console.log(`   Status: ${result.status}`);

    return {
      success: true,
      messageId: result.sid
    };

  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error);
    return {
      success: false,
      error: error.message || 'Unknown error sending SMS'
    };
  }
}

/**
 * Generate 6-digit verification code
 */
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send verification code via SMS
 */
export async function sendVerificationCode(to: string): Promise<{ success: boolean; code?: string; error?: string }> {
  const code = generateVerificationCode();

  const message = `Your Matchbook verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore.`;

  const result = await sendSMS(to, message);

  if (result.success) {
    return {
      success: true,
      code: code // Return code to store in database
    };
  }

  return {
    success: false,
    error: result.error
  };
}

/**
 * Check if Twilio is configured
 */
export const isTwilioConfigured = (): boolean => {
  return !!(accountSid && authToken && fromNumber);
};

/**
 * Get Twilio configuration status (for debugging)
 */
export const getTwilioStatus = () => {
  return {
    configured: isTwilioConfigured(),
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasFromNumber: !!fromNumber,
    fromNumber: fromNumber || 'Not configured'
  };
};

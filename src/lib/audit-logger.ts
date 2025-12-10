/**
 * FCRA-Compliant Audit Logger for Verification Flow
 *
 * This utility provides functions to:
 * 1. Log audit events to the Verification model
 * 2. Mask PII before logging
 * 3. Generate correlation IDs for request/response tracking
 * 4. Extract security context from requests
 */

import prisma from '@/lib/prismadb';
import { headers } from 'next/headers';
import * as crypto from 'crypto';

// Event types for audit logging
export type AuditEventType =
  | 'background_check_consent_given'
  | 'credit_check_consent_given'
  | 'permissible_purpose_certified'
  | 'credit_check_requested'
  | 'credit_check_response'
  | 'background_check_requested'
  | 'background_check_response'
  | 'payment_authorized'
  | 'payment_captured'
  | 'payment_cancelled'
  | 'report_accessed'
  | 'derived_info_shared'
  | 'adverse_action_initiated'
  | 'adverse_action_notice_sent';

export type AuditEventCategory =
  | 'consent'
  | 'api_call'
  | 'data_access'
  | 'adverse_action'
  | 'data_share';

export type ActorType = 'user' | 'system' | 'host' | 'admin';

export interface AuditEvent {
  eventType: AuditEventType;
  category: AuditEventCategory;
  timestamp: string;
  actorType: ActorType;
  actorId?: string;
  data: Record<string, unknown>;
  requestId?: string;
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface SecurityContext {
  ipAddress: string | null;
  userAgent: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  sessionId?: string | null;
  authMethod?: string | null;
}

/**
 * Generate a unique request ID for correlating request/response pairs
 */
export function generateRequestId(): string {
  return `req_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Hash a session ID for storage (don't store raw session IDs)
 */
export function hashSessionId(sessionId: string): string {
  return crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 32);
}

/**
 * Mask SSN to only show last 4 digits
 * Input: "123456789" or "123-45-6789"
 * Output: "***-**-6789"
 */
export function maskSSN(ssn: string | null | undefined): string {
  if (!ssn) return '***-**-****';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return '***-**-****';
  return `***-**-${digits.slice(-4)}`;
}

/**
 * Mask DOB to only show year
 * Input: "1990-05-15" or Date
 * Output: "1990"
 */
export function maskDOB(dob: string | Date | null | undefined): string {
  if (!dob) return '****';
  const dateStr = dob instanceof Date ? dob.toISOString() : dob;
  const year = dateStr.substring(0, 4);
  return /^\d{4}$/.test(year) ? year : '****';
}

/**
 * Extract city/state from full address for logging
 * We don't log full street addresses
 */
export function maskAddress(city?: string, state?: string): { city: string; state: string } {
  return {
    city: city || 'Unknown',
    state: state || 'Unknown',
  };
}

/**
 * Extract security context from Next.js request headers
 */
export async function getSecurityContext(): Promise<SecurityContext> {
  const headersList = await headers();

  // Get IP address from various headers (in order of reliability)
  const ipAddress =
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    null;

  // Get user agent
  const userAgent = headersList.get('user-agent');

  // Get geolocation from Vercel/Cloudflare headers if available
  const city = headersList.get('x-vercel-ip-city') || headersList.get('cf-ipcity');
  const region = headersList.get('x-vercel-ip-country-region') || headersList.get('cf-region');
  const country = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry');

  return {
    ipAddress,
    userAgent,
    city,
    region,
    country,
  };
}

/**
 * Add an audit event to the verification's audit history
 */
export async function addAuditEvent(
  verificationId: string,
  event: AuditEvent
): Promise<void> {
  try {
    // Get current audit history
    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      select: { auditHistory: true },
    });

    const currentHistory = (verification?.auditHistory as AuditEvent[] | null) || [];

    // Add new event
    const updatedHistory = [
      ...currentHistory,
      {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      },
    ];

    // Update verification with new history
    await prisma.verification.update({
      where: { id: verificationId },
      data: { auditHistory: updatedHistory },
    });

    console.log(`[Audit] Logged ${event.eventType} for verification ${verificationId}`);
  } catch (error) {
    // Don't throw - audit logging shouldn't break the main flow
    console.error('[Audit] Failed to log audit event:', error);
  }
}

/**
 * Log consent given event and update dedicated timestamp fields
 */
export async function logConsentGiven(
  verificationId: string,
  userId: string,
  consentType: 'background_check' | 'credit_check',
  securityContext: SecurityContext,
  additionalData?: Record<string, unknown>
): Promise<void> {
  const timestamp = new Date();
  const eventType = consentType === 'background_check'
    ? 'background_check_consent_given'
    : 'credit_check_consent_given';

  // Prepare update data for dedicated fields
  const updateData: Record<string, unknown> = {
    consentIpAddress: securityContext.ipAddress,
    consentUserAgent: securityContext.userAgent,
    consentCity: securityContext.city,
    consentRegion: securityContext.region,
    consentCountry: securityContext.country,
    consentSessionId: securityContext.sessionId,
    consentAuthMethod: securityContext.authMethod,
  };

  // Set the appropriate consent timestamp
  if (consentType === 'background_check') {
    updateData.backgroundCheckConsentAt = timestamp;
  } else {
    updateData.creditCheckConsentAt = timestamp;
  }

  try {
    // Update dedicated fields
    await prisma.verification.update({
      where: { id: verificationId },
      data: updateData,
    });

    // Also add to audit history
    await addAuditEvent(verificationId, {
      eventType,
      category: 'consent',
      timestamp: timestamp.toISOString(),
      actorType: 'user',
      actorId: userId,
      data: {
        consentType,
        ipAddress: securityContext.ipAddress,
        city: securityContext.city,
        region: securityContext.region,
        country: securityContext.country,
        ...additionalData,
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log consent:', error);
  }
}

/**
 * Log API request (before making the call)
 */
export async function logApiRequest(
  verificationId: string,
  provider: 'isoftpull' | 'accio' | 'stripe',
  requestId: string,
  maskedData: Record<string, unknown>
): Promise<void> {
  const timestamp = new Date();

  // Map provider to event type
  const eventType: AuditEventType =
    provider === 'isoftpull' ? 'credit_check_requested' :
    provider === 'accio' ? 'background_check_requested' :
    'payment_authorized';

  // Update dedicated timestamp field
  const updateData: Record<string, unknown> = {};
  if (provider === 'isoftpull') {
    updateData.creditCheckRequestedAt = timestamp;
    updateData.creditCheckRequestId = requestId;
  } else if (provider === 'accio') {
    updateData.backgroundCheckRequestedAt = timestamp;
    updateData.backgroundCheckRequestId = requestId;
  } else if (provider === 'stripe') {
    updateData.paymentAuthorizedAt = timestamp;
  }

  try {
    await prisma.verification.update({
      where: { id: verificationId },
      data: updateData,
    });

    await addAuditEvent(verificationId, {
      eventType,
      category: 'api_call',
      timestamp: timestamp.toISOString(),
      actorType: 'system',
      requestId,
      data: {
        provider,
        ...maskedData,
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log API request:', error);
  }
}

/**
 * Log API response (after receiving the response)
 */
export async function logApiResponse(
  verificationId: string,
  provider: 'isoftpull' | 'accio' | 'stripe',
  requestId: string,
  success: boolean,
  responseData: Record<string, unknown>,
  responseTimeMs?: number,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  const timestamp = new Date();

  // Map provider to event type
  const eventType: AuditEventType =
    provider === 'isoftpull' ? 'credit_check_response' :
    provider === 'accio' ? 'background_check_response' :
    success ? 'payment_captured' : 'payment_cancelled';

  // Update dedicated timestamp field
  const updateData: Record<string, unknown> = {};
  if (provider === 'isoftpull') {
    updateData.creditCheckCompletedAt = timestamp;
  } else if (provider === 'accio') {
    updateData.backgroundCheckCompletedAt = timestamp;
  } else if (provider === 'stripe') {
    if (success) {
      updateData.paymentCapturedAt = timestamp;
    } else {
      updateData.paymentCancelledAt = timestamp;
    }
  }

  try {
    await prisma.verification.update({
      where: { id: verificationId },
      data: updateData,
    });

    await addAuditEvent(verificationId, {
      eventType,
      category: 'api_call',
      timestamp: timestamp.toISOString(),
      actorType: 'system',
      requestId,
      success,
      errorCode,
      errorMessage,
      data: {
        provider,
        responseTimeMs,
        ...responseData,
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log API response:', error);
  }
}

/**
 * Log permissible purpose certification at verification submission
 */
export async function logPermissiblePurpose(
  verificationId: string,
  userId: string,
  purpose: string = 'rental_screening'
): Promise<void> {
  try {
    await prisma.verification.update({
      where: { id: verificationId },
      data: { permissiblePurpose: purpose },
    });

    await addAuditEvent(verificationId, {
      eventType: 'permissible_purpose_certified',
      category: 'consent',
      timestamp: new Date().toISOString(),
      actorType: 'user',
      actorId: userId,
      data: {
        purpose,
        fcraSection: '15 U.S.C. 1681b(a)(3)(F)', // Housing transactions
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log permissible purpose:', error);
  }
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  verificationId: string,
  eventType: 'payment_authorized' | 'payment_captured' | 'payment_cancelled',
  paymentIntentId: string,
  amount?: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  const timestamp = new Date();

  const updateData: Record<string, unknown> = {};
  if (eventType === 'payment_authorized') {
    updateData.paymentAuthorizedAt = timestamp;
  } else if (eventType === 'payment_captured') {
    updateData.paymentCapturedAt = timestamp;
  } else if (eventType === 'payment_cancelled') {
    updateData.paymentCancelledAt = timestamp;
  }

  try {
    await prisma.verification.update({
      where: { id: verificationId },
      data: updateData,
    });

    await addAuditEvent(verificationId, {
      eventType,
      category: 'api_call',
      timestamp: timestamp.toISOString(),
      actorType: 'system',
      success,
      errorMessage,
      data: {
        provider: 'stripe',
        paymentIntentId,
        amount,
      },
    });
  } catch (error) {
    console.error('[Audit] Failed to log payment event:', error);
  }
}

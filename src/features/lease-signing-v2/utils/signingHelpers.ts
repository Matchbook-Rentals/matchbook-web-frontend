import type { 
  SigningSession, 
  SigningWorkflow, 
  DocumentRecipient, 
  SigningNotification 
} from '../types';

/**
 * Generates a secure signing token
 */
export function generateSigningToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a signing URL for a recipient
 */
export function createSigningUrl(sessionId: string, token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/sign/${sessionId}?token=${token}`;
}

/**
 * Validates if a signing session is still valid
 */
export function isSigningSessionValid(session: SigningSession): {
  isValid: boolean;
  reason?: string;
} {
  if (session.status === 'completed') {
    return { isValid: false, reason: 'Session already completed' };
  }

  if (session.status === 'expired') {
    return { isValid: false, reason: 'Session has expired' };
  }

  if (new Date() > session.expiresAt) {
    return { isValid: false, reason: 'Session has expired' };
  }

  return { isValid: true };
}

/**
 * Calculates signing workflow progress
 */
export function calculateWorkflowProgress(workflow: SigningWorkflow): {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  completedSteps: number;
  isComplete: boolean;
} {
  const completedSteps = workflow.signingOrder.filter(step => step.status === 'completed').length;
  const percentage = workflow.totalSteps > 0 ? Math.round((completedSteps / workflow.totalSteps) * 100) : 0;
  const isComplete = completedSteps === workflow.totalSteps;

  return {
    currentStep: workflow.currentStep,
    totalSteps: workflow.totalSteps,
    percentage,
    completedSteps,
    isComplete,
  };
}

/**
 * Determines the next recipient in the signing order
 */
export function getNextRecipient(
  workflow: SigningWorkflow, 
  recipients: DocumentRecipient[]
): DocumentRecipient | null {
  const pendingStep = workflow.signingOrder.find(step => step.status === 'pending');
  if (!pendingStep) return null;

  return recipients.find(r => r.id === pendingStep.recipientId) || null;
}

/**
 * Generates notification content for different signing events
 */
export function generateNotificationContent(
  type: SigningNotification['type'],
  recipientName: string,
  documentName: string,
  signingUrl?: string
): { subject: string; message: string } {
  switch (type) {
    case 'invitation':
      return {
        subject: `Please sign: ${documentName}`,
        message: `Hello ${recipientName},\n\nYou have been requested to sign "${documentName}". Please click the link below to review and sign the document.\n\n${signingUrl}\n\nIf you have any questions, please contact the sender.\n\nThank you!`,
      };

    case 'reminder':
      return {
        subject: `Reminder: Please sign ${documentName}`,
        message: `Hello ${recipientName},\n\nThis is a friendly reminder that you have a document waiting for your signature: "${documentName}".\n\nPlease click the link below to review and sign:\n\n${signingUrl}\n\nThank you!`,
      };

    case 'completed':
      return {
        subject: `Document signed: ${documentName}`,
        message: `Hello ${recipientName},\n\nThank you for signing "${documentName}". The document has been successfully completed and all parties have signed.\n\nYou will receive a copy of the fully executed document shortly.\n\nThank you!`,
      };

    case 'declined':
      return {
        subject: `Document declined: ${documentName}`,
        message: `Hello,\n\n${recipientName} has declined to sign "${documentName}".\n\nPlease contact them directly if you need to discuss this decision.\n\nThank you.`,
      };

    case 'expired':
      return {
        subject: `Document signing expired: ${documentName}`,
        message: `Hello,\n\nThe signing session for "${documentName}" has expired. The document was not completed within the required timeframe.\n\nIf you still need this document signed, please create a new signing session.\n\nThank you.`,
      };

    default:
      return {
        subject: `Update on ${documentName}`,
        message: `Hello ${recipientName},\n\nThere has been an update on "${documentName}".\n\nThank you!`,
      };
  }
}

/**
 * Calculates when to send reminders based on signing deadline
 */
export function calculateReminderSchedule(
  expiresAt: Date,
  reminderDays: number[] = [1, 3, 7]
): Date[] {
  const now = new Date();
  const timeToExpiry = expiresAt.getTime() - now.getTime();
  const daysToExpiry = Math.ceil(timeToExpiry / (1000 * 60 * 60 * 24));

  return reminderDays
    .filter(days => days < daysToExpiry) // Only schedule reminders before expiry
    .map(days => {
      const reminderDate = new Date(expiresAt);
      reminderDate.setDate(reminderDate.getDate() - days);
      return reminderDate;
    })
    .filter(date => date > now) // Only future reminders
    .sort((a, b) => a.getTime() - b.getTime()); // Sort chronologically
}

/**
 * Validates signature data
 */
export function validateSignature(signatureData: {
  type: 'drawn' | 'typed' | 'uploaded';
  data: string;
}): { isValid: boolean; error?: string } {
  if (!signatureData.data || signatureData.data.trim() === '') {
    return { isValid: false, error: 'Signature data is required' };
  }

  switch (signatureData.type) {
    case 'drawn':
      // For drawn signatures, expect SVG or base64 image data
      if (!signatureData.data.startsWith('data:image/') && !signatureData.data.startsWith('<svg')) {
        return { isValid: false, error: 'Invalid drawn signature format' };
      }
      break;

    case 'typed':
      // For typed signatures, check minimum length
      if (signatureData.data.length < 2) {
        return { isValid: false, error: 'Typed signature must be at least 2 characters' };
      }
      break;

    case 'uploaded':
      // For uploaded signatures, expect base64 image data
      if (!signatureData.data.startsWith('data:image/')) {
        return { isValid: false, error: 'Invalid uploaded signature format' };
      }
      break;

    default:
      return { isValid: false, error: 'Unknown signature type' };
  }

  return { isValid: true };
}

/**
 * Formats signing status for display
 */
export function formatSigningStatus(status: DocumentRecipient['status']): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'gray', icon: 'clock' };
    case 'sent':
      return { label: 'Sent', color: 'blue', icon: 'mail' };
    case 'viewed':
      return { label: 'Viewed', color: 'yellow', icon: 'eye' };
    case 'signed':
      return { label: 'Signed', color: 'green', icon: 'check' };
    case 'declined':
      return { label: 'Declined', color: 'red', icon: 'x' };
    default:
      return { label: 'Unknown', color: 'gray', icon: 'help' };
  }
}

/**
 * Estimates signing time based on document complexity
 */
export function estimateSigningTime(fieldCount: number, signatureCount: number): {
  estimatedMinutes: number;
  category: 'quick' | 'standard' | 'complex';
} {
  // Base time: 1 minute per field, 2 minutes per signature
  const fieldTime = fieldCount * 1;
  const signatureTime = signatureCount * 2;
  const baseTime = fieldTime + signatureTime;

  // Add reading time (assumes 200 words per minute, ~500 words per page)
  const readingTime = Math.max(2, Math.ceil(fieldCount / 10)); // Rough estimate

  const totalMinutes = Math.max(3, baseTime + readingTime); // Minimum 3 minutes

  let category: 'quick' | 'standard' | 'complex' = 'standard';
  if (totalMinutes <= 5) category = 'quick';
  else if (totalMinutes > 15) category = 'complex';

  return {
    estimatedMinutes: totalMinutes,
    category,
  };
}

/**
 * Checks if a workflow can be canceled
 */
export function canCancelWorkflow(workflow: SigningWorkflow): {
  canCancel: boolean;
  reason?: string;
} {
  if (workflow.status === 'completed') {
    return { canCancel: false, reason: 'Workflow already completed' };
  }

  if (workflow.status === 'cancelled') {
    return { canCancel: false, reason: 'Workflow already cancelled' };
  }

  const hasSignedSteps = workflow.signingOrder.some(step => step.status === 'completed');
  if (hasSignedSteps && !workflow.metadata?.allowReassign) {
    return { 
      canCancel: false, 
      reason: 'Cannot cancel workflow with completed signatures' 
    };
  }

  return { canCancel: true };
}

/**
 * Generates audit trail entry
 */
export function createAuditEntry(
  action: string,
  recipientId: string,
  metadata?: Record<string, any>
): {
  timestamp: Date;
  action: string;
  recipientId: string;
  metadata?: Record<string, any>;
  id: string;
} {
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    action,
    recipientId,
    metadata,
  };
}
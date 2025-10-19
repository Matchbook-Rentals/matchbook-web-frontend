/**
 * Payment Error Code Utilities
 *
 * Maps Stripe error codes to human-readable failure reasons.
 * See /docs/payment-spec.md for complete error code list.
 */

/**
 * Get human-readable failure reason from Stripe error code.
 *
 * @param code - Stripe error code
 * @returns Human-readable failure reason
 */
export function getHumanReadableFailureReason(code: string): string {
  const reasons: Record<string, string> = {
    'R01': 'Insufficient funds in bank account',
    'R02': 'Bank account is closed or invalid',
    'R07': 'Payment authorization was revoked',
    'R10': 'Customer advised unauthorized transaction',
    'R29': 'Corporate customer advises not authorized',
    'insufficient_funds': 'Insufficient funds in your account',
    'account_closed': 'Bank account is closed',
    'authorization_revoked': 'Payment authorization was revoked',
    'debit_not_authorized': 'Debit transaction not authorized',
    'card_declined': 'Your card was declined',
    'expired_card': 'Your card has expired',
    'incorrect_cvc': 'Incorrect security code',
    'processing_error': 'A processing error occurred',
    'unknown': 'Bank declined the payment',
  };

  return reasons[code] || 'Bank declined the payment';
}

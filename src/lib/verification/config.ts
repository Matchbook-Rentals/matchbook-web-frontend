/**
 * Verification Flow Configuration
 *
 * Simple approach:
 * - Development: Routes call internal mock endpoints
 * - Production/Staging: Routes call real external APIs
 *
 * The ONLY difference is the URL.
 */

const isDev = process.env.NODE_ENV === 'development';

// =============================================================================
// URL Getters - The only thing that changes between dev and prod
// =============================================================================

/**
 * Get iSoftPull API URL.
 * DEV: Internal mock endpoint
 * PROD: Real iSoftPull API
 */
export const getISoftPullUrl = (): string =>
  isDev
    ? `${process.env.NEXT_PUBLIC_URL}/api/mock/isoftpull`
    : 'https://app.isoftpull.com/api/v2/reports';

/**
 * Get Accio API URL.
 * DEV: Internal mock endpoint
 * PROD: Real Accio API
 */
export const getAccioUrl = (): string =>
  isDev
    ? `${process.env.NEXT_PUBLIC_URL}/api/mock/accio`
    : 'https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml';

// =============================================================================
// Environment Checks (kept for marketing CTAs and credential validation)
// =============================================================================

export const VERIFICATION_ENV_VARS = {
  isoftpull: ['ISOFTPULL_API_ID', 'ISOFTPULL_API_TOKEN'],
  accio: ['ACCIO_ACCOUNT', 'ACCIO_PASSWORD'],
} as const;

/**
 * Check if all required verification API keys are configured.
 * Used by marketing pages to enable/disable CTAs.
 */
export const hasVerificationKeys = (): boolean => {
  const allKeys = [
    ...VERIFICATION_ENV_VARS.isoftpull,
    ...VERIFICATION_ENV_VARS.accio,
  ];
  return allKeys.every(key => !!process.env[key]);
};

/**
 * Check if iSoftPull credentials are configured.
 */
export const hasISoftPullKeys = (): boolean => {
  return VERIFICATION_ENV_VARS.isoftpull.every(key => !!process.env[key]);
};

/**
 * Check if Accio credentials are configured.
 */
export const hasAccioKeys = (): boolean => {
  return VERIFICATION_ENV_VARS.accio.every(key => !!process.env[key]);
};

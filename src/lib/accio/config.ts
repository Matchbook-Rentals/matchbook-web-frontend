/**
 * Accio Background Check Configuration
 *
 * Environment-based mock mode configuration:
 * - Development: Always mock (never hit Accio API)
 * - Staging: Mock if no credentials, live if credentials present
 * - Production: Always live
 */

export type AccioEnvironment = 'development' | 'staging' | 'production';
export type MockSubject = 'blackwood_dante' | 'doe_john';

export const getAccioEnvironment = (): AccioEnvironment => {
  // Explicit staging flag (only set on staging site)
  if (process.env.IS_STAGING === 'true') return 'staging';

  // Production if NODE_ENV is production (and not staging)
  if (process.env.NODE_ENV === 'production') return 'production';

  // Default to development
  return 'development';
};

export const shouldUseMock = (): boolean => {
  const env = getAccioEnvironment();
  if (env === 'development') return true;
  if (env === 'production') return false;

  // Staging: mock only if no credentials
  return !process.env.ACCIO_ACCOUNT || !process.env.ACCIO_PASSWORD;
};

export const MOCK_CONFIG = {
  webhookDelayMs: 2000,
  defaultSubject: 'blackwood_dante' as MockSubject,
};

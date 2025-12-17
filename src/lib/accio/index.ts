/**
 * Accio Background Check Module
 *
 * Provides environment-aware mock mode for background checks:
 * - Development: Always mock
 * - Staging: Mock if no credentials
 * - Production: Always live
 */

export * from './config';
export * from './mock-service';
export * from './mock-data';

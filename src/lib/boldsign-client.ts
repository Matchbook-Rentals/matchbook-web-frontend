import { DocumentApi } from 'boldsign';

const BOLDSIGN_API_KEY = process.env.BOLDSIGN_API_KEY;

if (!BOLDSIGN_API_KEY) {
  throw new Error('BOLDSIGN_API_KEY environment variable is required');
}

// Create and configure the BoldSign document API client
export const documentApi = new DocumentApi();
documentApi.setApiKey(BOLDSIGN_API_KEY);

// Centralized error handler for BoldSign operations
export function handleBoldSignError(error: unknown, operation: string): never {
  console.error(`BoldSign ${operation} failed:`, error);
  
  if (error instanceof Error) {
    throw new Error(`BoldSign ${operation} failed: ${error.message}`);
  }
  
  throw new Error(`BoldSign ${operation} failed: Unknown error`);
}
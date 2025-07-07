'use server'

import { auth } from '@clerk/nextjs/server'

export async function checkMetadataUpdated(): Promise<{ hasAgreedToTerms: boolean }> {
  const { sessionClaims } = auth();
  
  console.log(`[CHECK METADATA] Checking session metadata...`);
  console.log(`[CHECK METADATA] metadata.agreedToTerms: ${sessionClaims?.metadata?.agreedToTerms}`);
  console.log(`[CHECK METADATA] publicMetadata.agreedToTerms: ${sessionClaims?.publicMetadata?.agreedToTerms}`);
  
  const hasAgreedToTerms = sessionClaims?.metadata?.agreedToTerms || sessionClaims?.publicMetadata?.agreedToTerms || false;
  
  return { hasAgreedToTerms };
}
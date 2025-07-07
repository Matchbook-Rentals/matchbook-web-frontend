
import PlatformLayoutClient from '@/components/platform-components/platformLayoutClient'
import React from 'react'
import { auth, currentUser } from "@clerk/nextjs/server";

// Note: Terms agreement check moved to sign-in/sign-up flow

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const user = await currentUser();
  
  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;
  
  return (
    <PlatformLayoutClient userId={userId} user={userObject} isSignedIn={!!userId}>
      {children}
    </PlatformLayoutClient>
  )
}

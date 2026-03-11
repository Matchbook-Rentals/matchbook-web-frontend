import React from 'react';
import { auth, currentUser } from "@clerk/nextjs/server";
import RentNavbarSwitcher from '@/components/platform-components/rent-navbar-switcher';

export default async function RentLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const user = await currentUser();

  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  return (
    <div className="min-h-screen bg-background font-poppins">
      <RentNavbarSwitcher userId={userId} user={userObject} isSignedIn={!!userId} />
      <main>
        {children}
      </main>
    </div>
  );
}

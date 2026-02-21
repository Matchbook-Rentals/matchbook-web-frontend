'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserMenu from '@/components/userMenu';
import { getHostListingsCount } from '@/app/actions/listings';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface ListingDetailNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  hasListings?: boolean;
}

export default function ListingDetailNavbar({
  userId,
  user,
  isSignedIn,
  hasListings: hasListingsProp,
}: ListingDetailNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(hasListingsProp);

  useEffect(() => {
    async function checkUserListings() {
      if (isSignedIn && userId) {
        try {
          const count = await getHostListingsCount();
          setHasListings(count > 0);
        } catch {
          setHasListings(undefined);
        }
      }
    }
    checkUserListings();
  }, [isSignedIn, userId]);

  return (
    <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10 mb-4 md:mb-6 lg:mb-8 hidden md:block">
      {/* Header row - matches SearchResultsNavbar styling */}
      <header className="relative z-30 flex items-center justify-between px-6 h-[76px]">
        <Link href="/" className="flex-shrink-0">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        <div className="flex items-center gap-6 flex-shrink-0">
          <UserMenu
            color="white"
            mode="header"
            userId={userId}
            user={user}
            isSignedIn={isSignedIn}
            hasListings={hasListings}
          />
        </div>
      </header>
    </div>
  );
}

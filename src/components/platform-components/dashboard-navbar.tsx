'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

interface DashboardNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

export default function DashboardNavbar({ userId, user, isSignedIn }: DashboardNavbarProps) {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);

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
    <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10">
      <header className="flex items-center justify-between px-6 h-[76px]">
        <Link href="/">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>

        <div className="flex items-center gap-6">
          <Button
            asChild
            variant="outline"
            className="text-primaryBrand border-primaryBrand hover:bg-primaryBrand hover:text-white font-semibold transition-colors duration-300 hidden md:inline-flex"
          >
            <Link href={hasListings ? '/refer-host' : '/hosts'}>
              {hasListings ? 'Refer a Host' : 'Become a Host'}
            </Link>
          </Button>

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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/userMenu';
import SearchDialog from '@/components/home-components/SearchDialog';
import { getHostListingsCount } from '@/app/actions/listings';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface SearchNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
}

const searchFields = [
  { label: 'Where', placeholder: 'Choose Location', borderRight: true },
  { label: 'When', placeholder: 'Add Dates', borderRight: true },
  { label: 'Who', placeholder: 'Add Renters', borderRight: false },
];

export default function SearchNavbar({ userId, user, isSignedIn }: SearchNavbarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleOpenDialog = () => setIsDialogOpen(true);

  return (
    <>
      <div className="relative w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_18%,rgba(9,88,89,0.06)_100%)]">
        {/* Header row */}
        <header className="flex items-center justify-between px-6 h-[76px]">
          <Link href="/">
            <img
              className="w-[200px] hidden md:block"
              alt="MatchBook Logo"
              src="/new-green-logo.png"
            />
            <img
              className="w-[35px] block md:hidden"
              alt="MatchBook Logo"
              src="/logo-small.svg"
            />
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

        {/* Search bar row */}
        <div className="flex items-center justify-center w-full px-6 pb-6 pt-3">
          <div
            onClick={handleOpenDialog}
            className="flex items-center w-full max-w-[860px] h-[50px] pl-6 pr-3 py-2 bg-white rounded-full shadow-[0px_6px_12px_rgba(0,0,0,0.15)] cursor-pointer hover:shadow-[0px_6px_16px_rgba(0,0,0,0.2)] transition-shadow"
          >
            <div className="flex items-center gap-6 flex-1 min-w-0">
              {searchFields.map((field, index) => (
                <div
                  key={index}
                  className={`flex flex-col flex-1 min-w-0 ${
                    field.borderRight ? 'border-r border-gray-300 pr-6' : ''
                  }`}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {field.label}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {field.placeholder}
                  </span>
                </div>
              ))}
            </div>

            <Button
              size="icon"
              className="w-10 h-10 bg-primaryBrand hover:bg-primaryBrand/90 rounded-full flex-shrink-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog();
              }}
            >
              <SearchIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <SearchDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        hasAccess={true}
        headerText="Find your next home"
      />
    </>
  );
}

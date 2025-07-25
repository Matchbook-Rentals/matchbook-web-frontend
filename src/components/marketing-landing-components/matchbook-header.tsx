'use client'
import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import UserMenu from "../userMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getHostListingsCount } from "@/app/actions/listings";
interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface MatchbookHeaderProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  className?: string;
  buttonText?: string;
  buttonHref?: string;
}

export default function MatchbookHeader({ userId, user, isSignedIn, className, buttonText = "Become a Host", buttonHref = "/hosts" }: MatchbookHeaderProps): JSX.Element {
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    async function checkUserListings() {
      if (isSignedIn && userId) {
        try {
          const listingsCount = await getHostListingsCount();
          setHasListings(listingsCount > 0);
        } catch (error) {
          console.error('Error fetching listings count:', error);
          setHasListings(undefined);
        }
      }
    }
    
    checkUserListings();
  }, [isSignedIn, userId]);

  return (
    <header className={cn("flex w-full items-center justify-between px-6 py-1 bg-background", className)}>
      <div className="relative h-[72px] flex items-center">
        <Link href="/">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Button
          asChild
          variant="outline"
          className="text-[#3c8787] border-[#3c8787] hover:bg-primaryBrand hover:text-white font-medium transition-colors duration-300 hidden md:block"
        >
          <Link href={buttonHref}>
            {buttonText}
          </Link>
        </Button>

        <UserMenu color="white" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} hasListings={hasListings} />
      </div>
    </header>
  );
}

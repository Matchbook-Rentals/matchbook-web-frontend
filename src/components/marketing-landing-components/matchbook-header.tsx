'use client'
import React from "react";
import { Button } from "../../components/ui/button";
import UserMenu from "../userMenu";
import Link from "next/link";
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
}

export default function MatchbookHeader({ userId, user, isSignedIn }: MatchbookHeaderProps): JSX.Element {

  return (
    <header className="flex w-full items-center justify-between px-6 py-1 bg-white">
      <div className="relative h-[72px] flex items-center">
        <Link href="/">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          className="text-[#3c8787] border-[#3c8787] hover:bg-primaryBrand hover:text-white font-medium transition-colors duration-300 hidden md:block"

        >
          <Link href={'/hosts'}>
          Become a Host
          </Link>
        </Button>

        <UserMenu color="white" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} />
      </div>
    </header>
  );
}

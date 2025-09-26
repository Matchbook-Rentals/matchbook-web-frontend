'use client'
import React from "react";
import { Button } from "../../components/ui/button";
import UserMenu from "../userMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface GuestSearchNavbarProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  className?: string;
  buttonText?: string;
}

export default function GuestSearchNavbar({ userId, user, isSignedIn, className, buttonText = "Sign In" }: GuestSearchNavbarProps): JSX.Element {
  const handleSignIn = () => {
    const currentPath = window.location.pathname;
    const redirectUrl = encodeURIComponent(currentPath);
    window.location.href = `/sign-in?redirect_url=${redirectUrl}`;
  };

  return (
    <header className={cn("flex w-full items-center justify-between px-6 py-1 bg-background", className)}>
      <div className="relative h-[72px] flex items-center">
        <Link href="/">
          <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
          <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <UserMenu color="white" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} hasListings={false} />
      </div>
    </header>
  );
}
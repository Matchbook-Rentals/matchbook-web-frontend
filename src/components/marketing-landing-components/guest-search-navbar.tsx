'use client'
import React from "react";
import { Button } from "../../components/ui/button";
import UserMenu from "../userMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { motion } from "framer-motion";

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
    <motion.nav
      className={cn("bg-background border-b pb-1", className)}
      layout="position"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`flex mx-auto items-center py-1 justify-between ${APP_PAGE_MARGIN}`}
        layout="position"
        transition={{ duration: 0.3 }}
      >
        <motion.div className="w-1/3" layout="position" transition={{ duration: 0.3 }}>
          <Link href="/">
            <img
              src="/new-green-logo.png"
              alt="MatchBook Logo"
              className="w-[200px] hidden md:block"
            />
            <img
              src="/logo-small.svg"
              alt="MatchBook Logo"
              className="w-[35px] block md:hidden"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
        </motion.div>

        <motion.div className="w-1/3 flex justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="white" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} hasListings={false} />
        </motion.div>
      </motion.div>
    </motion.nav>
  );
}
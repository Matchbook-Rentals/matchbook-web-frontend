'use client'
import React from "react";
import UserMenu from "../userMenu";
import Link from "next/link";
import { APP_PAGE_MARGIN, PAGE_MARGIN } from "@/constants/styles";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface PlatformNavbarProps {
  userId?: string | null;
  user?: UserObject | null;
  isSignedIn?: boolean;
}

export default function PlatformNavbar({ userId, user, isSignedIn }: PlatformNavbarProps) {
  const pathName = usePathname();

  let marginClass;

  const isWidePath = pathName === '/platform/messages' || pathName.includes('/host/dashboard') || pathName.includes('/host/');

  isWidePath ? marginClass = APP_PAGE_MARGIN : marginClass = PAGE_MARGIN;

  return (
    <motion.nav
      className="bg-background border-b pb-1"
      layout="position"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`flex mx-auto items-center py-1 justify-between ${marginClass}`}
        layout="position"
        transition={{ duration: 0.3 }}
      >
        <motion.div className="w-1/3" layout="position" transition={{ duration: 0.3 }}>
          <Link href={"/"}>
            <img
              src="/new-green-logo.png"
              alt="MatchBook Logo"
              className="w-[200px] hidden md:block"
            />
            <img
              src="/logo-small.svg"
              alt="MatchBook Logo"
              className="w-[40px] block md:hidden"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
        </motion.div>

        <motion.div className="w-1/3 flex py-1 justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="black" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} />
        </motion.div>
      </motion.div>
    </motion.nav >
  );
}

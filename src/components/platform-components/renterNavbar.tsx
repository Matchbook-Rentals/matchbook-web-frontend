'use client'
import React, { useEffect, useState } from "react";
import UserMenu from "../userMenu";
import Link from "next/link";
import { APP_PAGE_MARGIN, PAGE_MARGIN } from "@/constants/styles";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { getHostListingsCount } from "@/app/actions/listings";

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface RenterNavbarProps {
  userId?: string | null;
  user?: UserObject | null;
  isSignedIn?: boolean;
}

export default function RenterNavbar({ userId, user, isSignedIn }: RenterNavbarProps) {
  const pathName = usePathname();
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

  let marginClass;

  const isWidePath = pathName === '/app/rent/messages' || pathName.includes('/host/dashboard') || pathName.includes('/host/') || pathName.includes('rent');

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
              className="w-[35px] block md:hidden"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
        </motion.div>

        <motion.div className="w-1/3 flex py-1 justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="black" mode="header" userId={userId} user={user} isSignedIn={isSignedIn} hasListings={hasListings} />
        </motion.div>
      </motion.div>
    </motion.nav >
  );
}

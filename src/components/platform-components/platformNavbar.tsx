'use client'
import React from "react";
import UserMenu from "../userMenu";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { APP_PAGE_MARGIN, PAGE_MARGIN } from "@/constants/styles";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PlatformNavbar() {
  const pathName = usePathname()
  const { isSignedIn } = useUser();

  let marginClass;

  const isWidePath = pathName === '/platform/messages' || pathName.includes('host-dashboard');

  isWidePath ? marginClass = APP_PAGE_MARGIN : marginClass = PAGE_MARGIN;

  return (
    <motion.nav
      className="bg-background border-b pb-2"
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
              src="/navbar-logo-full.png"
              alt="MatchBook Logo"
              className="hidden sm:block h-14 md:h-14 w-auto object-contain"
            />
            <img
              src="/House_Logo.png"
              alt="MatchBook Heart"
              className="sm:hidden h-10 w-auto object-contain pt-1"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
          <img
            src="/svg/heart-header.svg"
            className="h-8 w-auto object-contain hidden md:flex"
            alt="MatchBook Heart"
          />
        </motion.div>

        <motion.div className="w-1/3 flex py-1 justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="black" isSignedIn={isSignedIn} />
        </motion.div>
      </motion.div>
    </motion.nav >
  );
}

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
  const narrowPathNames = ['/platform/trips', '/platform/searches'];
  let marginClass;

  narrowPathNames.includes(pathName) ? marginClass = PAGE_MARGIN : marginClass = APP_PAGE_MARGIN;


  return (
    <motion.nav
      className="bg-background sticky top-0 z-50 border-b mb-6"
      layout="position"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`flex mx-auto items-center justify-between ${marginClass}`}
        layout="position"
        transition={{ duration: 0.3 }}
      >
        <motion.div className="w-1/3" layout="position" transition={{ duration: 0.3 }}>
          <Link href={"/"}>
            <img
              src="/navbar-logo-full.png"
              alt="MatchBook Logo"
              className="hidden sm:block h-14 md:h-14"
            />
            <img
              src="/House_Logo.png"
              alt="MatchBook Heart"
              className="sm:hidden h-10 w-10"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
          <img
            src="/svg/heart-header.svg"
            className="h-8 w-8 hidden md:flex"
            alt="MatchBook Heart"
          />
        </motion.div>

        <motion.div className="w-1/3 flex justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="black" isSignedIn={isSignedIn} />
        </motion.div>
      </motion.div>
    </motion.nav>
  );
}

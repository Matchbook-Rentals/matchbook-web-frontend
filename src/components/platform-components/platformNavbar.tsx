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
              className="w-[200px]"
            />
          </Link>
        </motion.div>

        <motion.div className="w-1/3 flex justify-center" layout="position" transition={{ duration: 0.3 }}>
        </motion.div>

        <motion.div className="w-1/3 flex py-1 justify-end" layout="position" transition={{ duration: 0.3 }}>
          <UserMenu color="black" isSignedIn={isSignedIn} mode="header" />
        </motion.div>
      </motion.div>
    </motion.nav >
  );
}

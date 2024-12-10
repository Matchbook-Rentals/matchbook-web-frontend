'use client'
import React from "react";
import Image from "next/image";
import UserMenu from "../userMenu";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import SlidingHeart from "./sliding-heart";
import { PAGE_MARGIN, APP_PAGE_MARGIN } from "@/constants/styles";
import { useSearchParams } from 'next/navigation';

export default function PlatformNavbar() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const marginClass = tab === 'map' || tab === 'favorites' ? APP_PAGE_MARGIN : PAGE_MARGIN;

  const { isSignedIn } = useUser();

  return (
    <nav className="bg-background sticky top-0 z-50 border-b  mb-9">
      <div className={`flex mx-auto items-center justify-between ${marginClass}`}>
        <div className="w-1/3">
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
        </div>
        <div className="w-1/3 flex justify-center">
          <img
            src="/svg/heart-header.svg"
            className="h-8 w-8 hidden md:flex"
            alt="MatchBook Heart"
          />
        </div>
        <div className="w-1/3 flex justify-end">
          <UserMenu color="black" isSignedIn={isSignedIn} />
        </div>
      </div>
    </nav>
  );
}

'use client'
import React, { useState } from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";
import Link from "next/link";
import { Button } from "../ui/button";
import { Montserrat } from "next/font/google";
import { CountdownDialog } from "@/app/page";

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

interface MatchbookHeaderProps {
  handleListProperty: (() => void) | false;
}

export default function MatchbookHeader({ handleListProperty = false }: MatchbookHeaderProps) {
  const [defaultIsOpen, setDefaultIsOpen] = useState(false);

  const handleDefault = () => {
    setDefaultIsOpen(true);
  }

  return (
    <div className="sticky mb-0 top-0 bg-background transition-all duration-100 ease-in z-30 pb-0 border-b">
      {!handleListProperty && (
        <CountdownDialog isOpen={defaultIsOpen} setIsOpen={setDefaultIsOpen} />
      )}
      <header className="relative flex mb-0 w-full md:w-[90vw] lg:w-[80vw] px-2 md:px-0 mx-auto justify-center pt-2 items-center border-b-0 pb-2">
        {/* Logo container with responsive visibility */}
        <div className="flex items-center absolute left-2 xs:static xs:mr-auto">
          <Link href={"/"}>
            <img
              src="/navbar-logo-full.png"
              alt="MatchBook Logo"
              className="hidden sm:block w-[full] h-14 md:h-14"
            />
            <img
              src="/House_Logo.png"
              alt="MatchBook Heart"
              className="sm:hidden h-10 w-10"
            />
          </Link>
        </div>

        {/* Center heart logo */}
        <img
          src="/svg/heart-header.svg"
          className="h-8 w-8 hidden md:flex"
          alt="MatchBook Heart"
        />

        {/* Right-side elements container */}
        <div className="flex md:space-x-4 items-center absolute right-2 xs:static xs:ml-auto">
          <Link className="hidden xs:flex" href={"?tab=list#list-your-property"} shallow>
            <Button
              className={`w-[191px] h-[36px] text-[18px] rounded-[15px]
                         border-[1px] font-normal border-charcoal ${montserrat.className}`}
              onClick={handleListProperty || handleDefault}
              variant={"outline"}
            >
              List your property
            </Button>
          </Link>
          <MenuIcon className="text-charcoal h-[31px] w-[31px]" />
          <UserIcon className="h-[33px] w-[30px]" />
        </div>

        {/* Centered button container for mobile */}
        <div className="xs:hidden flex justify-center items-center flex-1">
          <Link href={"?tab=list#list-your-property"} shallow>
            <Button
              className={`w-[191px] h-[36px] text-[18px] rounded-[15px]
                         border-[1px] font-normal border-charcoal ${montserrat.className}`}
              onClick={handleListProperty || handleDefault}
              variant={"outline"}
            >
              List your property
            </Button>
          </Link>
        </div>
      </header>
    </div>
  );
}

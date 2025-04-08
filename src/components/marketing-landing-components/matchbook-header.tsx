'use client'
import React, { useState, useEffect } from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";
import Link from "next/link";
import { Button } from "../ui/button";
import { CountdownDialog } from "@/app/page";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { UserButton } from "@clerk/nextjs";
import { useAuth, useUser } from "@clerk/nextjs";
import UserMenu from "../userMenu";


interface MatchbookHeaderProps {
  handleListProperty?: (() => void) | false;
  customMargin?: boolean;
  isSticky?: boolean;
}

export default function MatchbookHeader({
  handleListProperty = false,
  customMargin = true,
  isSticky = false
}: MatchbookHeaderProps) {
  const [defaultIsOpen, setDefaultIsOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      }
    };

    checkAccess();
  }, [isSignedIn, user]);

  const handleDefault = () => {
    setDefaultIsOpen(true);
  }

  //setTimeout(() => {
  //  if (window?.FreshworksWidget) {
  //    window?.FreshworksWidget('show', 'launcher');
  //  }
  //}, 300)

  return (
    <div className="mb-0 bg-background transition-all duration-100 ease-in z-30 pb-0 border-b">
      {!handleListProperty && (
        <CountdownDialog isOpen={defaultIsOpen} setIsOpen={setDefaultIsOpen} />
      )}
      <header className={`flex mb-0 w-full ${customMargin ? 'md:w-[90vw] lg:w-[80vw]' : 'md:w-full lg:w-full'} px-2 md:px-0 mx-auto justify-between items-center py-1 border-b-0`}>
        {/* Logo container with responsive visibility - 1/3 width like platform navbar */}
        <div className="w-1/3 flex items-center">
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
        </div>

        {/* Center heart logo - 1/3 width with centered content */}
        <div className="w-1/3 flex justify-center">
          <img
            src="/svg/heart-header.svg"
            className="h-8 w-auto object-contain hidden md:flex"
            alt="MatchBook Heart"
          />
        </div>

        {/* Right-side elements container - 1/3 width with right aligned content */}
        <div className="w-1/3 flex space-x-2 md:space-x-4 items-center justify-end">
          <Link className="hidden md:flex" href={"/hosts"} shallow>
            <Button
              className="w-[191px] h-[36px] text-[18px] rounded-[15px]
                         border-[1px] font-normal border-charcoal"
              variant={"outline"}
            >
              List your property
            </Button>
          </Link>
          <UserMenu isSignedIn={isSignedIn} color="black" />
        </div>

      </header>
    </div>
  );
}

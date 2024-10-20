import React, { useEffect, useState } from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";
import Link from "next/link";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function MatchbookHeader() {
  const [scrollY, setScrollY] = useState(0);


  return (
    // Updated transition classes for a 3-second duration
    <div
      className={`sticky mb-0 md:mb-20 top-0 bg-background transition-all duration-100 ease-in z-30 pb-0 border-b`}
    >
      <header
        className={`relative flex mb-0 test w-full md:w-[90vw] lg:w-[80vw] px-2 md:px-0 mx-auto justify-between pt-4 items-start border-b-0 pb-2`}
      >
        <div className="flex items-center" >
          <Link href={"/"}>
            <img
              src="logo-nav-new.png"
              alt="MatchBook Logo"
              className="hidden sm:block w-[full] h-14 md:h-14"
            />
            <img
              src="House_Logo.png"
              alt="MatchBook Heart"
              className="sm:hidden h-10 w-10"
            />
          </Link>
        </div>
        <img
          src="/svg/heart-header.svg"
          className="h-10 w-8 hidden md:flex "
          alt="MatchBook Heart"
        />
        <div className="flex md:space-x-4 items-center">
          <Link href={"/?tab=list#list-your-property"} shallow>
            <Button
              className="border px-2  border-black mr-2 lg:mr-8 lg:text-lg"
              variant={"outline"}
            >
              List your property
            </Button>
          </Link>
          <MenuIcon className=" text-charcoal h-12 w-12 md:h-14 md:w-14" />
          <UserIcon className="  h-12 w-10 md:h-14 md:w-14" />
        </div>
      </header>
    </div>
  );
}

'use client'
import React, { useEffect, useState } from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";
import Link from "next/link";
import { Button } from "../ui/button";


const defaultListProperty = () => {
  console.log('Awaiting dialog import')
}

export default function MatchbookHeader({ handleListProperty = defaultListProperty }) {


  return (
    // Updated transition classes for a 3-second duration
    <div
      className={`sticky mb-0  top-0 bg-background transition-all duration-100 ease-in z-30 pb-0 border-b`}
    >
      <header
        className={`relative flex mb-0 w-full md:w-[90vw] lg:w-[80vw] px-2 md:px-0 mx-auto justify-between pt-2 items-center border-b-0 pb-2`}
      >
        <div className="flex items-center " >
          <Link href={"/"}>
            <img
              src="navbar-logo-full.png"
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
        <div className="flex md:space-x-1 items-center ">
          <Link href={"/?tab=list#list-your-property"} shallow>
            <Button
              className="border px-2 py-1  border-black lg:mr-0 lg:text-[15px] "
              onClick={handleListProperty}
              variant={"outline"}
            >
              List your property
            </Button>
          </Link>
          <MenuIcon className=" text-charcoal h-8 w-8 " />
          <UserIcon className="  h-8 w-8 " />
        </div>
      </header>
    </div>
  );
}

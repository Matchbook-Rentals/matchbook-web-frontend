import React from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";

export default function MatchbookHeader() {
  return (
    <div className="sticky top-0 bg-white z-30 ">
      <header className="relative flex mb-6 px-4 sm:px-12 md:px-16 lg:px-30 xl:px-36 2xl:px-44 justify-between pt-4 pb-8 items-start border-b-0">
        <div className="flex items-center">
          <img src="logo-nav-new.png" alt="MatchBook Logo" className="hidden sm:block w-full h-14" />
          <img src="/svg/heart-header.svg" alt="MatchBook Heart" className="sm:hidden h-10 w-10" />
        </div>
        <div className="absolute inset-x-0 bottom-2 hidden md:flex justify-center  md:w-[70px] lg:w-[100px] mx-auto bg-white">
          <img src="/svg/heart-header.svg" className="h-14 w-14  heart" alt="MatchBook Heart" />
        </div>
        <div className="flex md:space-x-4 items-center">
          <MenuIcon className="h-12 w-12 md:h-14 md:w-14" />
          <UserIcon className="h-12 w-10 md:h-14 md:w-14" />
        </div>
        <style jsx>{`
          header::before {
            content: '';
            position: absolute;
            bottom: 30%;
            left: 0;
            right: 0;
            height: 1px;
            background-color: lightgray;
          }
          .heart::before {
            content: '';
            position: absolute;
            bottom: 25%;
            left: -25px;
            right: -25px;
            height: 30px;
            background-color: red;
            z-index: 1;
          }
        `}</style>
      </header>
    </div>
  )
}

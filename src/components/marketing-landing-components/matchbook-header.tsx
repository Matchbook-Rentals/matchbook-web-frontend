import React from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";

export default function MatchbookHeader() {
  return (
    <header className="relative flex justify-between p-4 border-b items-start">
      <div className="flex">
        <img src="logo-nav-new.png" alt="MatchBook Logo" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <img src="/svg/heart-header.svg" className="h-16 w-16" alt="MatchBook Heart" />
      </div>
      <div className="flex space-x-4">
        <MenuIcon className="h-16 w-16" />
        <UserIcon className="h-16 w-16" />
      </div>
    </header>
  )
}

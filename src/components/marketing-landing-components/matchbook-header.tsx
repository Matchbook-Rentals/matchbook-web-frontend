'use client'
import React from "react";
import { Button } from "../../components/ui/button";
import UserMenu from "../userMenu";
import Link from "next/link";

export default function MatchbookHeader(): JSX.Element {

  return (
    <header className="flex w-full items-center justify-between px-6 py-1 bg-white">
      <div className="relative h-[72px] flex items-center">
        <img className=" w-[200px]" alt="MatchBook Logo" src="/new-green-logo.png" />
      </div>

      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          className="text-[#3c8787] border-[#3c8787] hover:bg-primaryBrand hover:text-white font-medium transition-colors duration-300"

        >
          <Link href={'/hosts'}>
          Become a Host
          </Link>
        </Button>

        <UserMenu color="white" mode="header" />
      </div>
    </header>
  );
}

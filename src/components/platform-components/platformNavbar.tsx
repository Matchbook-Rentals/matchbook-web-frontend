import React from "react";
import Image from "next/image";
import UserMenu from "../userMenu";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import SlidingHeart from "./sliding-heart";

export default async function PlatformNavbar() {
  const user = await currentUser();
  let isSignedIn = Boolean(user);

  return (
    <nav className="bg-white flex items-center justify-between pt-2 pr-9 w-full border-b sticky top-0 border-black mb-9 z-50">
      <div className="w-1/3">
        <Link href={"/"}>
          <Image
            src={"/logo-nav-2.png"}
            alt="logo"
            width={400}
            height={400}
            className=""
          />
        </Link>
      </div>
      <div className="w-1/3 flex justify-center">
        <SlidingHeart />
      </div>
      <div className="w-1/3 flex justify-end">
        <UserMenu color="black" isSignedIn={isSignedIn} />
      </div>
    </nav>
  );
}

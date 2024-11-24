import React from "react";
import Image from "next/image";
import UserMenu from "../userMenu";
import { User, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import SlidingHeart from "./sliding-heart";

export default async function PlatformNavbar() {
  const clerkUser: User | null = await currentUser();
  let isSignedIn = Boolean(clerkUser);

  const updateUserImage = async () => {
    'use server'

    try {
      if (!clerkUser?.id) {
        throw new Error('User ID is missing')
      }

      const dbUser = await prisma?.user.findUnique({
        where: { id: clerkUser.id }
      })

      if (!dbUser) {
        throw new Error('User not found in database')
      }

      if (clerkUser.imageUrl !== dbUser.imageUrl) {
        console.log("NOT SAME")
        let result = await prisma?.user.update({ where: { id: dbUser.id }, data: { imageUrl: clerkUser.imageUrl } })

        console.log(result)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
      return { error: 'Failed to fetch user data' }
    }
  }

  return (
    <nav className="bg-white sticky top-0 z-50 border-b  mb-9">
      <div className="flex items-center justify-between w-full md:w-[90vw] lg:w-[95vw] mx-auto pt-2 pb-2 px-2 md:px-0">
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
          <UserMenu color="black" isSignedIn={isSignedIn} updateUserImage={updateUserImage} />
        </div>
      </div>
    </nav>
  );
}

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

    console.log("CALLED")
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

      if (clerkUser.imageUrl !== dbUser.imageUrl){
        console.log("NOT SAME")
       let result = await prisma?.user.update({where: {id: dbUser.id}, data: {imageUrl: clerkUser.imageUrl}})

        console.log(result)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
      return { error: 'Failed to fetch user data' }
    }
  }

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
        <UserMenu color="black" isSignedIn={isSignedIn} updateUserImage={updateUserImage} />
      </div>
    </nav>
  );
}

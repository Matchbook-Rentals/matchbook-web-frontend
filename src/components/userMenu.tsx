'use client'
import Image from 'next/image';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover"
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';





export default function UserMenu({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="flex items-center">

      {isSignedIn ?
        <div className='flex items-center'>
          <Image src={"/svg/hamburger.svg"} alt='person icon' width={50} height={50} className='' />
          <UserButton ></UserButton>

        </div>
        :
        <>
          <Popover>
            <PopoverTrigger>
              <Image src={"/svg/hamburger.svg"} alt='person icon' width={50} height={50} className='' />

            </PopoverTrigger>
            <PopoverContent className='w-full p-0'>
              <Link href={"/sign-in"} className='hover:bg-primaryBrand/50 cursor-pointer w-full text-left pl-3 pr-14 border-b border-black'>Sign In</Link>
              <p className='hover:bg-primaryBrand/50 cursor-pointer pl-3'>Get help</p>
            </PopoverContent>

          </Popover>
          <Image src={"/svg/account.svg"} alt='person icon' width={50} height={50} className='rounded-full border-white border-[3px] pb-1' />
        </>
      }


    </div>
  )
}
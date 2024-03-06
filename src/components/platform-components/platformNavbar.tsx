import React from 'react'
import Image from 'next/image'
import UserMenu from '../userMenu'
import { currentUser } from '@clerk/nextjs'

export default async function PlatformNavbar() {
  const user = await currentUser();
  let isSignedIn = Boolean(user);
  return (
    <nav className="bg-white flex items-center justify-between pt-2 pr-9 w-full border-b sticky top-0 border-black mb-9 ">
      <div className='w-1/3'>
        <Image src={"/logo-nav-2.png"} alt="logo" width={400} height={400} className='' />
      </div>
      <div className='w-1/3 flex justify-center translate-y-8'>
        <Image src={"/heart-logo.png"} alt="logo" width={60} height={60} className='' />

      </div>
      <div className="w-1/3 flex justify-end">
        <UserMenu color='black' isSignedIn={isSignedIn} />
      </div>
    </nav>
  )
}

import React from 'react'
import Image from 'next/image'
import UserMenu from '../userMenu'
import { currentUser } from '@clerk/nextjs'

export default async function PlatformNavbar() {
  const user = await currentUser();
  let isSignedIn = Boolean(user);
  return (
    <nav className="bg-white flex items-center justify-between py-2 px-9 w-full ">
      <div></div>
      <Image src={"/logo-nav-full.png"} alt="logo" width={450} height={450} className='' />
      <div className="justify-self-right">
        <UserMenu color='black' isSignedIn={isSignedIn} />
      </div>
    </nav>
  )
}

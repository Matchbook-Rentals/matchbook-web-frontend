import React from 'react'
import Image from "next/image";
import UserMenu from './userMenu';

export default function NavBar() {
  return (
      <nav className="bg-primary flex md:justify-between justify-center pb-2 w-full ">
        <Image src={"/logo-nav-full.png"} alt="logo" width={450} height={450} className='hidden md:block' />
        <div className="flex items-center justify-between md:justify-end  w-full gap-6 pr-6">
          <button className="rounded-full xl:mr-10 bg-white text-lg border border-gray-500 pl-6 pr-8 py-3 text-gray-500 text-center ">List your place</button>
          <UserMenu />
        </div>
      </nav>
  )
}

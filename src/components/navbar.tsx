import React from 'react'
import Image from "next/image";
import UserMenu from './userMenu';

export default function NavBar() {
  return (
      <nav className="bg-primary flex justify-between py-3 w-full ">
        <Image src={"/logo-nav-full.png"} alt="logo" width={400} height={400} />
        <div className="flex items-center gap-6 pr-6">
          <button className="rounded-full xl:mr-10 bg-white text-lg border border-gray-500 px-5 py-3 text-gray-500 text-center ">List Your Place</button>
          <UserMenu />
        </div>
      </nav>
  )
}

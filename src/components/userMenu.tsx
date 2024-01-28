'use client'
import Image from 'next/image';
import React from 'react'




export default function UserMenu() {
  return (
    <div className="flex items-center">

      <Image src={"/svg/hamburger.svg"} alt='person icon' width={50} height={50} className='' />
      <Image src={"/svg/account.svg"} alt='person icon' width={50} height={50} className='rounded-full border-white border-[3px] pb-1' />

    </div>
  )
}
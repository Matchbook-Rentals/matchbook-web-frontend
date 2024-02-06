'use client';
import React from 'react';
import { BiSearch } from 'react-icons/bi';

export default function SearchContainer() {
  return (
    <div className="border border-gray-500 w-full md:w-auto py-6 px-4 rounded-full bg-white text-gray-500   shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center justify-between ">

        <div className="text-lg pl-2 pr-20 ">
          <input type="text" placeholder='Where to?' className='placeholder:text-gray-500 focus:outline-primaryBrand focus:outline-dotted' />
        </div>
        <div className="hidden sm:block text-lg py-2 pl-6 border-x-[1px] border-gray-500 flex-1">
          <input type="text" placeholder='Move In:' className='placeholder:text-gray-500' />
        </div>
        <div className="hidden text-left sm:block py-2 text-lg pl-6 border-r-[1px] border-gray-500 flex-1 ">
          Move Out:
        </div>
        <div className="text-lg pl-6 pr-8  ">
         <p>Who?</p> 
        </div>
        <div className="p-2 bg-primaryBrand rounded-full text-white ">
          <BiSearch className='text-4xl' />
        </div>
      </div>

    </div>
  )
}

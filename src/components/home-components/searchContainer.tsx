import React from 'react'
import Container from '../container'
import { BiSearch } from 'react-icons/bi'

export default function SearchContainer() {
  return (
    <div className="border border-gray-500 w-full md:w-auto py-4 px-4 rounded-full bg-white text-gray-500   shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center justify-between">

        <div className="text-lg  pl-2 pr-8">
          Where to?
        </div>
        <div className="hidden sm:block text-lg  px-6 border-x-[1px] border-gray-500 flex-1">
          Move In:
        </div>
        <div className="hidden text-left sm:block text-lg px-6 border-r-[1px] border-gray-500 flex-1 ">
          Move Out:
        </div>
        <div className="text-lg pl-2 pr-8  ">
         <p>Who?</p> 
        </div>
        <div className="p-2 text-lg bg-primary rounded-full text-white ">
          <BiSearch />
        </div>
      </div>

    </div>
  )
}

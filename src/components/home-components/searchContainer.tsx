import React from 'react'
import Container from '../container'
import { BiSearch } from 'react-icons/bi'

export default function SearchContainer() {
  return (
    <div className="border border-gray-500 w-full md:w-auto py-2 px-4 rounded-full bg-white text-gray-500   shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center justify-between">

        <div className="text-sm font-semibold px-6">
          Where to?
        </div>
        <div className="hidden sm:block text-sm font-semibold px-6 border-x-[1px] border-gray-500 flex-1 text-center">
          Move In:
        </div>
        <div className="hidden sm:block text-sm font-semibold px-6 border-r-[1px] border-gray-500 flex-1 text-center">
          Move Out:
        </div>
        <div className="text-sm pl-6 pr-2  flex flex-row items-center gap-3">
          Who?
        </div>
        <div className="p-2 bg-primary rounded-full text-white ">
          <BiSearch />
        </div>
      </div>

    </div>
  )
}

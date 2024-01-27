import React from 'react'
import Container from '../container'
import { BiSearch } from 'react-icons/bi'

export default function SearchContainer() {
  return (
    <div className="border w-full md:w-auto py-2 rounded-full shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center justify-between">

        <div className="text-sm font-semibold px-6">
          Where to?
        </div>
        <div className="hidden sm:block text-sm font-semibold px-6 border-x-[1px] flex-1 text-center">
          Move In:
        </div>
        <div className="hidden sm:block text-sm font-semibold px-6 border-x-[1px] flex-1 text-center">
          Move Out:
        </div>
        <div className="text-sm pl-6 pr-2  flex flex-row items-center gap-3">
          Who?
        </div>
        <div className="p-2 bg-primary rounded-full text-white ">
<BiSearch></BiSearch>
        </div>
      </div>

    </div>
  )
}

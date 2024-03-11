'use client'

import React from 'react'
import { Listing } from '@/types'

export default function MatchBar({currListing, handleLike}: {currListing: Listing, handleLike: Function}) {
  return (
    <div onClick={handleLike} className='flex w-3/4 mx-auto border px-2 py-3 mt-3 border-black rounded-3xl '>

      <div className='flex justify-between items-center w-1/2 px-2 border-r-[1px] border-gray-400'>
        <div className='text-center text-2xl font-semibold'>{currListing.title}</div>
        <span>Heart Icon Placeholder</span>
      </div>
      <div className='flex justify-between w-1/2 px-2 items-center border-gray-400'>

        <span>Cross Icon Placeholder</span>
        <div className='text-center text-lg font-semibold'>
          <p>${currListing.price}/month</p>
          <p>{currListing.roomCount} bedroom / {currListing.bathroomCount} bathroom</p>
          <p>distance from center point (lol)</p>
        </div>
      </div>
    </div>
  )
}

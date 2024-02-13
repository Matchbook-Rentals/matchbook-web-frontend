import React from 'react'

export default function MatchBar() {
  return (
    <div className='flex w-3/4 mx-auto border px-2 py-3 mt-3 border-black rounded-3xl '>

      <div className='flex justify-between items-center w-1/2 px-2 border-r-[1px] border-gray-400'>
        <div className='text-center text-2xl font-semibold'>Listing Title</div>
        <span>Heart Icon Placeholder</span>
      </div>
      <div className='flex justify-between w-1/2 px-2 items-center border-gray-400'>

        <span>Cross Icon Placeholder</span>
        <div className='text-center text-lg font-semibold'>
          <p>listing $/month</p>
          <p>listing rooms</p>
          <p>distance from center point</p>
        </div>
      </div>
    </div>
  )
}

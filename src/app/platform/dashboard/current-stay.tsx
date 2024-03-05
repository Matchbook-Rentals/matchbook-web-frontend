import Image from 'next/image'
import React from 'react'

export default function CurrentStay() {
  return (
    <div>
      <h2 className='text-center text-3xl font-semibold border-b-2 pb-3'>Your Current Stay</h2>
      <div className='grid grid-cols-3 gap-y-10 py-10 w-3/4 mx-auto'>
        <div className='text-3xl font-semibold'><span className='underline'>Ogden Mountain Home</span> <span className='text-3xl'>&gt;</span></div>

        <div className='text-3xl font-semibold text-center'>Trip Start - Trip End</div>
        <div className='placeholder'></div>
        <div>
          <Image src={"https://source.unsplash.com/random/1"} alt="logo" width={500} height={350} className='rounded-xl' />
        </div>
        <div className='text-2xl font-semibold flex flex-col justify-center items-center gap-2'>
          <p><span className='underline'>Next Payment</span><span>&gt;</span></p>
          <p>April 1st, 2024</p>
          <p>$1600</p>
        </div>
        <div className='border-black border-2 text-2xl font-semibold grid grid-cols-6 rounded-lg py-4'>

          <span className='col-span-5 pl-8'>Messages</span><span className='text-3xl'>&gt;</span>
          <span className='col-span-5 pl-8'>Lease Download</span><span className='text-3xl'>&gt;</span>
          <span className='col-span-5 pl-8'>Payment History</span><span className='text-3xl'>&gt;</span>
          <span className='col-span-5 pl-8'>Modify Stay Request</span><span className='text-3xl'>&gt;</span>
          <span className='col-span-5 pl-8'>Lorem ipsum</span><span className='text-3xl'>&gt;</span>
        </div>
      </div>
    </div>
  )
}

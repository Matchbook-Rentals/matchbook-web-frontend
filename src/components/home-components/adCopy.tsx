import Image from 'next/image'
import React from 'react'

export default function AdCopy() {
  return (
    <div className='flex flex-col justify-center items-center'>
      <h2 className=' text-center text-primaryBrand text-3xl md:text-7xl tracking-widest mt-5'>find a place you love <HeartIcon /></h2>
      <h3 className=' text-center w-full md:w-2/3 text-primaryBrand text-lg md:text-2xl tracking-wider mt-5 p-1 md:translate-x-8'>explore our rental marketplace, reimagined with you in mind.</h3>
    </div>
  )
}

function HeartIcon() {
  return (
    <Image src={'/svg/heart.svg'} alt='heart-icon' width={24} height={24} className='inline' />
  )
}
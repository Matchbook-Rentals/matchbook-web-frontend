import React from 'react'

export default function AdCopy() {
  return (
    <div className='flex flex-col justify-center'>
      <h2 className=' text-center text-primary text-7xl tracking-widest mt-5'>find a place you love <HeartIcon /></h2>
      <h3 className=' text-center text-primary text-2xl tracking-wide mt-5 translate-x-8'>explore our rental marketplace, reimagined with you in mind.</h3>
    </div>
  )
}

function HeartIcon() {
  return (
    <svg  className='inline transform scale-150' xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
    </svg>
  )
}
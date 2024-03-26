import ListIcon from '@/components/ui/list-icon'
import PlusIcon from '@/components/ui/plus-icon'
import WindowIcon from '@/components/ui/window-icon'
import Image from 'next/image'
import React from 'react'
import prisma from '@/lib/prismadb'
import PropertyList from './property-list'

const pullMockListingsFromDb = async () => {
  'use server';

  try {
    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: ["1", "2", "3"], // Looks for listings where the value field is either "1", "2", or "3"
        },
      },
    });
    return listings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error; // Re-throw the error for further handling
  }
}

export default async function HostDashboard() {
  const listings = await pullMockListingsFromDb();

  return (
    <div className='px-20'>
      <div className=' add-property-box w-fit flex ml-auto '>
        <div className='bg-primaryBrand rounded-full mr-2 p-0'>

          {/* <PlusIcon size={6} color='black' /> */}
          <span className='text-2xl font-bold rounded-full px-2 '>+</span>
        </div>
        <p className='font-semibold text-2xl'>Add a property</p>
      </div>
      <div className='role:propertyCounter  border-2 border-black rounded-lg my-2 py-2 '>
        <div className='flex ml-10 justify-between mr-10'>
          <div className='flex gap-3'>
            <p className='font-semibold text-2xl'>All (m)</p>
            <p className='font-semibold text-2xl'>For rent (m)</p>
            <p className='font-semibold text-2xl'>Rented (m)</p>
          </div>
          <div className='flex rounded-lg border border-slate-600  '>
            <div className='p-1'><ListIcon size={{ height: 35, width: 35 }} borderRight /></div>
            <div className='bg-primaryBrand py-1 px-3 rounded-r-lg '><WindowIcon width={22} height={35} /></div>

          </div>
        </div>
      </div>
      <PropertyList properties={listings} />

    </div>
  )
}

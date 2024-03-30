import ListIcon from '@/components/ui/list-icon'
import PlusIcon from '@/components/ui/plus-icon'
import WindowIcon from '@/components/ui/window-icon'
import Image from 'next/image'
import React from 'react'
import prisma from '@/lib/prismadb'
import PropertyList from './property-list'
import PropertyHeader from './property-header'

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
      <PropertyHeader />
      <PropertyList properties={listings} />

    </div>
  )
}

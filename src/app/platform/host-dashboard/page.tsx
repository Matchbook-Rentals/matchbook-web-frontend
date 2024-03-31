import ListIcon from '@/components/ui/list-icon'
import PlusIcon from '@/components/ui/plus-icon'
import WindowIcon from '@/components/ui/window-icon'
import Image from 'next/image'
import React from 'react'
import prisma from '@/lib/prismadb'
import PropertyList from './property-list'
import PropertyHeader from './property-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    <div className='w-4/5 mx-auto'>
      <div className=' add-property-box w-fit flex ml-auto '>
        <div className='bg-primaryBrand rounded-full mr-2 p-0'>

          {/* <PlusIcon size={6} color='black' /> */}
          <span className='text-2xl font-bold rounded-full px-2 '>+</span>
        </div>
        <p className='font-semibold text-2xl'>Add a property</p>
      </div>
      <Button className='w-fit text-2xl  flex ml-auto' variant='ghost'>
        <Link className='flex' href='/platform/host-dashboard/add-property' >

          <div className='bg-primaryBrand rounded-full mr-2 p-0'>

            {/* <PlusIcon size={6} color='black' /> */}
            <span className='text-2xl font-bold rounded-full px-2 '>+</span>
          </div>
          Add a property
        </Link>
      </Button>
      <PropertyHeader />
      <PropertyList properties={listings} />

    </div>
  )
}

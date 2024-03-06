import { Trip } from '@/types'
import React from 'react'

export default function UpcomingBookings({upcomingBookings}: {upcomingBookings: Trip[]}) {
  return (
    <div>
      <h2 className='text-center text-3xl font-semibold w-1/2 mx-auto border-b-2 pb-3'>Your Upcoming Bookings</h2>
      {upcomingBookings.length === 0 ? <p className='text-2xl text-center mb-5 mt-2'>You don&apos;t have any reserved bookings</p> : null}
</div>
  )
}

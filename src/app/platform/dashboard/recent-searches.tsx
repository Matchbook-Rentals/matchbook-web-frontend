import { Trip } from '@/types'
import React from 'react'
import TripBar from './trip-bar'

export default function RecentSearches({trips}: {trips: Trip[]}) {
  return (
    <div>
      <h2 className='text-center text-3xl border-b-2 pb-3'>Your Recent Searches</h2>
      {/* THis needs to be changed to === instead of !== once db is updated with tripStatus */}
      {trips.map((trip, idx) => {
        if (trip.tripStatus !== 'searching') return <TripBar key={trip.id} trip={trip} />
      })}
    </div>
  )
}

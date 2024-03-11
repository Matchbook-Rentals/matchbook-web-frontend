import React from 'react'
import prisma from '@/lib/prismadb'

const mockListings = [
  // Sample Listing 1
  {
    id: "1",
    title: "Cozy Downtown Loft",
    description: "A spacious and modern loft located in the heart of the city. Perfect for weekend getaways and business trips.",
    imageSrc: "image-source-url-1",
    createdAt: "2023-03-10T10:00:00Z",
    category: "Loft",
    roomCount: 1,
    bathroomCount: 1,
    guestCount: 2,
    latLng: "40.712776,-74.005974",
    locationString: "New York, NY, USA",
    city: "New York",
    state: "NY",
    streetAddress1: "123 Main St",
    streetAddress2: null,
    postalCode: "10001",
    userId: "user-id-1",
    price: 150,
    wifi: true,
    airConditioning: true,
    heating: true,
    kitchen: true,
    washer: true,
    dryer: true,
    parking: false,
    pool: false,
    hotTub: false,
    gym: true,
    elevator: true,
    petsAllowed: false,
    smokingAllowed: false,
    eventsAllowed: false,
    privateEntrance: true,
    secure: true,
    fireplace: false,
    waterfront: false,
    beachfront: false,
    mountainView: false,
    tripId: null
  },

  // Sample Listing 2
  {
    id: "2",
    title: "Beachfront Villa",
    description: "Experience the ultimate relaxation in our beachfront villa, featuring stunning ocean views and private beach access.",
    imageSrc: "image-source-url-2",
    createdAt: "2023-03-15T15:00:00Z",
    category: "Villa",
    roomCount: 3,
    bathroomCount: 2,
    guestCount: 6,
    latLng: "26.122439,-80.137317",
    locationString: "Fort Lauderdale, FL, USA",
    city: "Fort Lauderdale",
    state: "FL",
    streetAddress1: "456 Ocean Blvd",
    streetAddress2: null,
    postalCode: "33301",
    userId: "user-id-2",
    price: 300,
    wifi: true,
    airConditioning: true,
    heating: false,
    kitchen: true,
    washer: true,
    dryer: true,
    parking: true,
    pool: true,
    hotTub: true,
    gym: false,
    elevator: false,
    petsAllowed: true,
    smokingAllowed: false,
    eventsAllowed: true,
    privateEntrance: true,
    secure: true,
    fireplace: false,
    waterfront: true,
    beachfront: true,
    mountainView: false,
    tripId: null
  },

  // Sample Listing 3
  {
    id: "3",
    title: "Mountain Cabin Retreat",
    description: "Escape to our cozy cabin in the mountains for a peaceful retreat. Enjoy hiking, skiing, and breathtaking views.",
    imageSrc: "image-source-url-3",
    createdAt: "2023-03-20T20:00:00Z",
    category: "Cabin",
    roomCount: 2,
    bathroomCount: 1,
    guestCount: 4,
    latLng: "39.739235,-104.990250",
    locationString: "Denver, CO, USA",
    city: "Denver",
    state: "CO",
    streetAddress1: "789 Mountain Rd",
    streetAddress2: "Unit 2",
    postalCode: "80202",
    userId: "user-id-3",
    price: 200,
    wifi: true,
    airConditioning: false,
    heating: true,
    kitchen: true,
    washer: false,
    dryer: false,
    parking: true,
    pool: false,
    hotTub: true,
    gym: false,
    elevator: false,
    petsAllowed: true,
    smokingAllowed: false,
    eventsAllowed: false,
    privateEntrance: true,
    secure: true,
    fireplace: true,
    waterfront: false,
    beachfront: false,
    mountainView: true,
    tripId: null
  }

]

const addListings = async () => {
  'use server';


  for (let listing of mockListings) {
  let db_listing = await prisma.listing.create({ data: listing })
  }
}
export default function TestPage() {
  return (
    <div className='text-white bg-black h-[100vh]'>
      {/* Create button or form to execute addListings */}
      <form action={addListings}><button type="submit">Submit</button></form>

    </div>
  )
}

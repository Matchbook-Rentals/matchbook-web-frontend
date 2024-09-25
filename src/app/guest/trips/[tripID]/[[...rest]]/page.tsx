import React from 'react';
import prisma from '@/lib/prismadb';
import { SignIn, SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { TripStatus, User, Listing, Match, Favorite, HousingRequest, Dislike, Application } from '@prisma/client';

export default async function Page({ params, searchParams }: { params: { tripID: string, rest: string[] }, searchParams: { invited: string } }) {
  const { userId } = auth();
  const trip = await prisma.trip.findUnique({
    where: {
      id: params.tripID,
    },
    include: {
      user: true,
      matches: true,
      housingRequests: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">{trip?.locationString}</h2>
      {userId ? (
        <>
          <p className="mb-4">
            Hello {searchParams.invited}! You&apos;ve been invited on a trip to {trip?.locationString} with {trip?.user.firstName}.
            This is an exciting opportunity to join them on their adventure!
          </p>
          <Link href={`/platform/searches?currentTrip=${params.tripID}`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Continue to Trip
          </Link>
        </>
      ) : (
        <>
          <p className="mb-4">
            Hello {searchParams.invited}! You&apos;ve been invited on a trip to {trip?.locationString} with {trip?.user.firstName}.
            To continue and join this exciting adventure, please sign in or sign up below.
          </p>
          <div className="flex items-center space-x-4">
            <div className="w-5/12 flex items-center justify-center flex-col">
              <h3 className="text-xl text-center font-semibold mb-2">Sign In</h3>
              <SignIn redirectUrl={`/platform/searches?currentTrip=${params.tripID}`} />
            </div>
            <div className="w-2/12 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-400">OR</span>
            </div>
            <div className="w-5/12 flex items-center justify-center flex-col">
              <h3 className="text-xl text-center font-semibold mb-2">Sign Up</h3>
              <SignUp redirectUrl={`/platform/searches?currentTrip=${params.tripID}`} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

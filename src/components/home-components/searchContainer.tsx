
'use client';
import React, { useState, useRef, FormEvent } from 'react';
import { BiSearch, BiPlus, BiMinus } from 'react-icons/bi';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Prisma, Trip } from '@prisma/client';
import LocationSuggest from './location-suggest';

type SearchContainerProps = {
  createTrip: Function
}


export default function SearchContainer({ createTrip }: SearchContainerProps) {

  // is there a better way to establish this state
  const [destination, setDestination] = useState({ locationString: '', latitude: 0, longitude: 0 });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [moveOutDate, setMoveOutDate] = useState<Date>();
  const [queryString, setQueryString] = useState('');

  const moveOutRef = useRef<HTMLInputElement>(null);
  const moveInRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // console.log(user);


  const incrementCount = (type: string) => {
    if (type === 'adults') setAdults(adults + 1);
    if (type === 'children') setChildren(children + 1);
    if (type === 'pets') setPets(pets + 1);
  };

  const decrementCount = (type: string) => {
    if (type === 'adults' && adults > 0) setAdults(adults - 1);
    if (type === 'children' && children > 0) setChildren(children - 1);
    if (type === 'pets' && pets > 0) setPets(pets - 1);
  };


  const handleSubmit = () => {

  }

  const saveTripDetails = async () => {

    if (isSignedIn) {
      const trip: Trip = {
        locationString: destination.locationString,
        latitude: destination.latitude,
        longitude: destination.longitude,
        userId: user.id,
        ...(moveOutDate && { endDate: moveOutDate }), // Add endDate only if moveOutDate is truthy
        ...(moveInDate && { startDate: moveInDate }), // Add startDate only if moveInDate is truthy
        ...(pets && { numPets: pets }), // Add numPets only if pets is truthy
        ...(adults && { numAdults: adults }), // Add numAdults only if adults is truthy
        ...(children && { numChildren: children }) // Add numChildren only if children is truthy
      };



      try {

        const newTrip: Trip = await createTrip(trip)
        localStorage.setItem('matchbookTripId', newTrip.id)
        // router.push(`/platform/trips/${newTrip.id}`)

        return newTrip

      } catch (error) {
        alert(error.message);

      }


    }

    else {
      const queryParams = [];

      // For each state, check if it has a truthy value and add to queryParams
      if (destination) queryParams.push(`destination=${encodeURIComponent(destination)}`);
      if (adults) queryParams.push(`adults=${adults}`);
      if (children) queryParams.push(`children=${children}`);
      if (pets) queryParams.push(`pets=${pets}`);
      if (moveInDate) queryParams.push(`moveInDate=${moveInDate.toISOString().split('T')[0]}`);
      if (moveOutDate) queryParams.push(`moveOutDate=${moveOutDate.toISOString().split('T')[0]}`);

      // Join all query parameters with '&' and prefix with '?'
      let tempQueryString = `?${queryParams.join('&')}`
      setQueryString(tempQueryString);
      localStorage.setItem('tripQueryString', tempQueryString);

      return tempQueryString;

      // Here you can use queryString, for example, to navigate to a search results page
      // router.push(`/guest/trips/${queryString}`)
    }
  }

  const pushToTripView = async (event: FormEvent) => {
    event.preventDefault();
    localStorage.removeItem('matchbookUserPreferences');

    let tripDetails = await saveTripDetails();
    console.log('is Signed In-----', isSignedIn)


    if (isSignedIn) {
      router.push(`/platform/trips/${tripDetails.id}`)
    }
    else {
      router.push(`/guest/trips/${tripDetails}`)

    }
  };

  const pushToPreferenceView = async () => {
    let tripDetails = await saveTripDetails();
    console.log(tripDetails);
    router.push('/platform/preferences');
  }
}

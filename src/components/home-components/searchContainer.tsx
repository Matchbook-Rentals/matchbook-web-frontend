'use client';
import React, { useState, useRef, FormEvent } from 'react';
import { BiSearch, BiPlus, BiMinus } from 'react-icons/bi';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Prisma } from '@prisma/client';


export default function SearchContainer() {

  const [destination, setDestination] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [moveOutDate, setMoveOutDate] = useState<Date>();

  const moveOutRef = useRef<HTMLInputElement>(null);
  const moveInRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { isSignedIn } = useUser();


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


  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const queryParams = [];

    // For each state, check if it has a truthy value and add to queryParams
    if (destination) queryParams.push(`destination=${encodeURIComponent(destination)}`);
    if (adults) queryParams.push(`adults=${adults}`);
    if (children) queryParams.push(`children=${children}`);
    if (pets) queryParams.push(`pets=${pets}`);
    if (moveInDate) queryParams.push(`moveInDate=${moveInDate.toISOString().split('T')[0]}`);
    if (moveOutDate) queryParams.push(`moveOutDate=${moveOutDate.toISOString().split('T')[0]}`);

    // Join all query parameters with '&' and prefix with '?'
    const queryString = `?${queryParams.join('&')}`;

    // Here you can use queryString, for example, to navigate to a search results page
    console.log(queryString); // For demonstration, logging to the console
    router.push(`/platform/trips/${queryString}`)
  };

  return (
    <div className="border border-gray-500 w-full md:w-auto rounded-full bg-white text-gray-500 shadow-sm hover:shadow-md transition cursor-pointer">
      <form className="flex flex-row items-center justify-between pr-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder='Where to?'
          className='placeholder:text-gray-500 focus:outline-none rounded-full text-lg h-full p-5 md:p-8 cursor-pointer'
          onChange={(e) => setDestination(e.target.value)}
          onClick={() => console.log(destination)}
        />
        <Popover>
          <PopoverTrigger className="hidden text-left sm:block text-lg py-2 pl-6 sm:border-l-[1px] md:border-x-[1px] border-gray-500 flex-1" onClick={() => moveInRef.current?.focus()}>
            {moveInDate ? moveInDate.toUTCString().slice(0, 16) : "Move In:"}
            {/* <p>date picker</p> */}
          </PopoverTrigger>
          <PopoverContent className='mt-5'>
            <Calendar
            mode="single"
            selected={moveInDate}
            onSelect={setMoveInDate}
            initialFocus
             />
          </PopoverContent>
        </Popover>
        <Popover>
        <PopoverTrigger className="hidden text-left md:block text-lg py-2 pl-6 lg:border-r-[1px] border-gray-500 flex-1 cursor-pointer" onClick={() => moveOutRef.current?.focus()}>
            {moveOutDate ? moveOutDate.toUTCString().slice(0, 16) : "Move Out:"}
        </PopoverTrigger>
        <PopoverContent className='mt-5'>
            <Calendar
            mode="single"
            selected={moveOutDate}
            onSelect={setMoveOutDate}
            initialFocus
             />
        </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger className="hidden xl:block text-lg pl-6 pr-8">
            <p>Who?</p>
          </PopoverTrigger>
          <PopoverContent className='mt-8'>
            <div className='flex items-center justify-between my-2'>
              <BiMinus onClick={() => decrementCount('adults')} className='cursor-pointer text-3xl border border-black  rounded-full' />
              <span className='text-xl'>Adults: {adults}</span>
              <BiPlus onClick={() => incrementCount('adults')} className='cursor-pointer text-3xl border border-black  rounded-full' />
            </div>
            <div className='flex items-center justify-between my-2'>
              <BiMinus onClick={() => decrementCount('children')} className='cursor-pointer text-3xl border border-black  rounded-full' />
              <span className='text-xl'>Children: {children}</span>
              <BiPlus onClick={() => incrementCount('children')} className='cursor-pointer text-3xl border border-black  rounded-full' />
            </div>
            <div className='flex items-center justify-between my-2'>
              <BiMinus onClick={() => decrementCount('pets')} className='cursor-pointer text-3xl border border-black  rounded-full' />
              <span className='text-xl'>Pets: {pets}</span>
              <BiPlus onClick={() => incrementCount('pets')} className='cursor-pointer text-3xl border border-black  rounded-full' />
            </div>
          </PopoverContent>
        </Popover>
        <div className="p-2 bg-primaryBrand rounded-full text-white">
          <BiSearch className='text-4xl' />
        </div>
      </form>
    </div>
  );
}

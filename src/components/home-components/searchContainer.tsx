'use client';
import React, { useState, useRef } from 'react';
import { BiSearch, BiPlus, BiMinus } from 'react-icons/bi';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function SearchContainer() {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);

  const moveOutRef = useRef<HTMLInputElement>(null);
  const moveInRef = useRef<HTMLInputElement>(null);


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

  return (
    <div className="border border-gray-500 w-full md:w-auto rounded-full bg-white text-gray-500 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center justify-between pr-4">
        <input
          type="text"
          placeholder='Where to?'
          className='placeholder:text-gray-500 focus:outline-primaryBrand rounded-full text-lg h-full p-5 md:p-8 cursor-pointer'
        />
        <div className="hidden sm:block text-lg py-2 pl-6 sm:border-l-[1px] md:border-x-[1px] border-gray-500 flex-1" onClick={() => moveInRef.current?.focus()}>
          Move In:<input ref={moveInRef} type="date" placeholder='Move In:' className='placeholder:text-gray-500' />
        </div>
        <div className="hidden text-left md:block  text-lg pl-6 lg:border-r-[1px] border-gray-500 flex-1 cursor-pointer" onClick={() => moveOutRef.current?.focus()}>
          Move Out:<input ref={moveOutRef} type="date" placeholder='Move In:' className='placeholder:text-gray-500' />
        </div>
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
      </div>
    </div>
  );
}

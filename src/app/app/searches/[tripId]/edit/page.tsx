'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import SearchEditBar from '@/components/home-components/search-edit-bar';
import Image from 'next/image';

const EditTripPage: React.FC = () => {
  const params = useParams();
  const tripId = params.tripId as string;

  return (
    <div className="relative w-full mx-auto">
      {/* Background gradient with reduced opacity */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#5B96BE_00%,#61A7D8_39.5%,#6CC3FF_100%)] opacity-50" />

      {/* Content that sits above the background */}
      <div className="relative w-full mx-auto flex flex-col justify-between">
        <div className="py-6">
          <h1 className="text-2xl font-bold text-center mb-4">Edit Search</h1>
          <SearchEditBar />
        </div>
        <Image
          src="/village-footer-opaque.png"
          alt="Village footer"
          width={1200}
          height={200}
          className="w-[80%] mx-auto mt-8 sm:mt-16 h-auto max-h-[70%] z-10"
        />
      </div>
    </div>
  );
};

export default EditTripPage;
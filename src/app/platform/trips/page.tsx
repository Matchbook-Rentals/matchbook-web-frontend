import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import TripGrid from './(trips-components)/trip-grid';
import { PAGE_MARGIN } from '@/constants/styles';
import Image from 'next/image';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips({ next: { tags: ['user-trips'] } });

  return (
    <div className={`bg-background ${PAGE_MARGIN} mx-auto`}>
      <h1
        className="font-montserrat-regular text-[14px]"
      >
        Searches
      </h1>

      <div className="w-full mx-auto mb-4">
        <Image
          src="/milwaukee-downtown.png"
          alt="Village footer"
          width={1200}
          height={516}
          className="w-[1000px] h-[216px] mx-auto p-0 my-0"
        />
        <div className='bg-[#5C9AC5] rounded-md w-full h-[21px] -translate-y-[2px]' />
      </div>
      <TripGrid initialTrips={trips} />

    </div>
  );
};

export default TripsPage;

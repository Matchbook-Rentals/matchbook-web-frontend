'use client';

import React from 'react';
import Image from 'next/image';
import SearchEditBar from '@/components/home-components/search-edit-bar';

const OverviewTab: React.FC = () => {
  return (
    <>
      <h3 className="text-[24px] font-montserrat font-medium leading-normal text-[#404040]">Edit Search</h3>
      <div className="w-full mx-auto bg-[#869A7D]/50">
      <div className="w-[80%] h-[400px] mx-auto relative ">
        <SearchEditBar />
        <Image
          src="/village-footer-opaque.png"
          alt="Village footer"
          width={1200}
          height={200}
          className="w-full h-auto bottom-0 absolute"
        />
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
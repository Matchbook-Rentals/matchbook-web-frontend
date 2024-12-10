'use client';

import React from 'react';
import Image from 'next/image';
import SearchEditBar from '@/components/home-components/search-edit-bar';
import { MatchbookVerified } from '@/components/icons/views';
import { RejectIcon } from '@/components/icons/actions';

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

      <div className="flex justify-between w-[80%] mx-auto mt-8 gap-4">
        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-gray-600">
              {/* import paper icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7L11.8845 4.76892C11.5634 4.1268 10.9344 3.71429 10.2309 3.71429H5.78571C4.79949 3.71429 4 4.51378 4 5.5V18.5C4 19.4862 4.79949 20.2857 5.78571 20.2857H18.2143C19.2005 20.2857 20 19.4862 20 18.5V9.28571C20 8.29949 19.2005 7.5 18.2143 7.5L13 7Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-lg font-medium">Application</span>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-[#869A7D]">
              <MatchbookVerified />
            </div>
            <span className="text-lg font-medium">Matchbook Verification</span>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-white bg-pinkBrand rounded-full  w-[65px] h-[65px] flex items-center justify-center ">
              X
            </div>
            <h3 className="text-lg font-medium ">Disliked Properties</h3>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-gray-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7L11.8845 4.76892C11.5634 4.1268 10.9344 3.71429 10.2309 3.71429H5.78571C4.79949 3.71429 4 4.51378 4 5.5V18.5C4 19.4862 4.79949 20.2857 5.78571 20.2857H18.2143C19.2005 20.2857 20 19.4862 20 18.5V9.28571C20 8.29949 19.2005 7.5 18.2143 7.5L13 7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M15.5355 8.46447L8.46447 15.5355" stroke="#FF0000" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8.46447 8.46447L15.5355 15.5355" stroke="#FF0000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-lg font-medium">Declined Applications</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
'use client';

import React from 'react';
import Image from 'next/image';
import SearchEditBar from '@/components/home-components/search-edit-bar';
import { MatchbookVerified } from '@/components/icons/views';
import { DeniedPaperIcon, PaperIcon, RejectIcon } from '@/components/icons/actions';

const OverviewTab: React.FC = () => {
  return (
    <>
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

      <div className="flex flex-wrap justify-between w-full  mx-auto mt-8 gap-4">
        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-gray-600">
              {/* import paper icon */}
              <div className="w-1/2">
                <PaperIcon className="w-[65px] h-[65px] " />
              </div>
            </div>
            <span className="text-lg font-medium">Application</span>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-[#869A7D] w-1/2">
              <MatchbookVerified className="w-[65px] h-[65px]" />
            </div>
            <span className="text-lg font-medium">Matchbook Verification</span>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-1/2">
              <RejectIcon className="w-[65px] h-[65px] bg-pinkBrand rounded-full p-2" />
            </div>
            <h3 className=" font-medium ">Disliked Properties</h3>
          </div>
        </div>

        <div className="flex-1 p-6 border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="text-gray-600 relative">
              <div className="w-1/2">
                <DeniedPaperIcon className="w-[65px] h-[65px]" />
              </div>
            </div>
            <span className="text-lg font-medium">Declined Applications</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;

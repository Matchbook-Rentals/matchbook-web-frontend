'use client';

import React from 'react';
import Image from 'next/image';
import SearchEditBar from '@/components/home-components/search-edit-bar';
import { MatchbookVerified } from '@/components/icons/views';
import { DeniedPaperIcon, PaperIcon, RejectIcon } from '@/components/icons/actions';

interface BigButtonProps {
  Icon: React.ComponentType<{ className?: string }>;
  text: string;
  iconClassName?: string;
  iconWrapperClassName?: string;
}

const BigButton: React.FC<BigButtonProps> = ({
  Icon,
  text,
  iconClassName = '',
  iconWrapperClassName = ''
}) => {
  const buttonStyles = `
    w-1/3 md:w-1/5 p-4 md:p-2 lg:p-4 xl:p-6 border
    rounded-lg shadow-sm cursor-pointer flex
    items-center md:gap-3 hover:shadow-md transition-shadow
  `;
  const iconStyles = "w-[65px] h-[65px] md:w-[35px] md:h-[35px] lg:w-[65px] lg:h-[65px]";

  return (
    <div className={buttonStyles}>
      <div className={`shrink-0 ${iconWrapperClassName}`}>
        <Icon className={`${iconStyles} ${iconClassName}`} />
      </div>
      <div className="flex-1 text-center">
        <span className="text-base md:text-xs lg:text-base text-green lg:text-lg font-medium block">
          {text}
        </span>
      </div>
    </div>
  );
};

const OverviewTab: React.FC = () => {
  return (
    <>
      <div className="w-full mx-auto bg-[#869A7D]/50">
        <div className="w-full h-[520px] mx-auto flex flex-col justify-between ">

          <SearchEditBar />
          <Image
            src="/village-footer-opaque.png"
            alt="Village footer"
            width={1200}
            height={200}
            className="w-[70%] mx-auto h-auto max-h-[70%]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row  flex-wrap  items-center sm:justify-around md:justify-between w-full mx-auto mt-8 gap-4">
        <BigButton Icon={PaperIcon} text="Application" />
        <BigButton
          Icon={MatchbookVerified}
          text="Matchbook Verification"
          iconWrapperClassName="text-[#869A7D]"
        />
        <BigButton
          Icon={RejectIcon}
          text="Disliked Properties"
          iconClassName="bg-pinkBrand rounded-full p-2"
        />
        <BigButton Icon={DeniedPaperIcon} text="Declined Applications" />
      </div>
    </>
  );
};

export default OverviewTab;

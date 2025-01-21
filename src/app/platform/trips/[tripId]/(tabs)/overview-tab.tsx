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
    w-2/3 sm:w-1/3 md:w-1/5 px-6 py-2 border
    rounded-lg shadow-sm cursor-pointer flex
    items-center justify-center gap-2 hover:shadow-md transition-shadow `;

  // Added responsive border colors and made wrapper div relative
  const iconStyles = `
  lg:max-h-[55px] lg:max-w-[55px] 
  md:max-h-[50px] md:max-w-[50px]  
  sm:max-h-[43px] sm:max-w-[45px] 
  max-h-[30px] max-w-[30px] 
  w-full  relative
  transition-all duration-200 ease-in-out
`;

  return (
    <div className={buttonStyles}>
      <div className={`shrink-0 ${iconWrapperClassName}`}>
        <Icon className={`${iconStyles} ${iconClassName}`} />
      </div>
      <div className="flex-1 text-center">
        <span className="text-[clamp(0.75rem,1.5vw,1.125rem)] text-green font-medium block">
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
        <div className="w-full  mx-auto flex flex-col justify-between ">

          <SearchEditBar />
          <Image
            src="/village-footer-opaque.png"
            alt="Village footer"
            width={1200}
            height={200}
            className="w-[80%] mx-auto mt-8 sm:mt-16 h-auto max-h-[70%]"
          />
        </div>
      </div>

      <div className="flex flex-wrap  items-center justify-around md:justify-between w-full mx-auto mt-8 gap-4">
        <BigButton Icon={PaperIcon} text="Application" />
        <BigButton
          Icon={MatchbookVerified}
          text="Matchbook Verification"
          iconWrapperClassName="text-[#869A7D]"
        />
        <BigButton
          Icon={RejectIcon}
          text="Disliked Properties"
          iconClassName="bg-pinkBrand rounded-full p-[25%] "
        />
        <BigButton Icon={DeniedPaperIcon} text="Declined Applications" />
      </div>
    </>
  );
};

export default OverviewTab;

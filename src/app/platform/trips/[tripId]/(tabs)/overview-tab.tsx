'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SearchEditBar from '@/components/home-components/search-edit-bar';
import { MatchbookVerified } from '@/components/icons/views';
import { DeniedPaperIcon, PaperIcon, RejectIcon } from '@/components/icons/actions';
import { ApplicationIcon, DeclinedApplicationIcon, DeniedIcon } from '@/components/icons';

interface BigButtonProps {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subTitle: string;
  iconClassName?: string;
  iconWrapperClassName?: string;
  href: string;
}

const BigButton: React.FC<BigButtonProps> = ({
  Icon,
  title,
  subTitle,
  iconClassName = '',
  iconWrapperClassName = '',
  href
}) => {
  const buttonStyles = `
    w-full h-full px-[10%] lg:px-[8%] xl:px-[10%] py-2 bg-background border font-montserrat drop-shadow-custom
    transition-all rounded-lg cursor-pointer flex flex-col items-start
    gap-2 max-w-[300px] mx-auto sm:mx-0 sm:even:ml-auto sm:odd:mr-auto lg:mx-auto
  `;

  const iconStyles = `h-[30px] w-[30px]`;

  return (
    <Link href={href} className={buttonStyles}>
      <div className={`shrink-0 drop-shadow-none ${iconWrapperClassName}`}>
        <Icon className={`${iconStyles} ${iconClassName}`} />
      </div>
      <div className="flex-1 text-left my-2">
        <span className="text-[14px] font-medium block">
          {title}
        </span>
        <span className="text-[12px] text-gray-500 block">
          {subTitle}
        </span>
      </div>
    </Link>
  );
};

const OverviewTab: React.FC = () => {
  const params = useParams();
  const tripId = params.tripId as string;

  return (
    <>
      <div className="relative w-full mx-auto">
        {/* Background gradient with reduced opacity */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#5B96BE_00%,#61A7D8_39.5%,#6CC3FF_100%)] opacity-50" />

        {/* Content that sits above the background */}
        <div className="relative w-full mx-auto flex flex-col justify-between">
          <SearchEditBar />
          <Image
            src="/village-footer-opaque.png"
            alt="Village footer"
            width={1200}
            height={200}
            className="w-[80%] mx-auto mt-8 sm:mt-16 h-auto max-h-[70%] z-10"
          />
        </div>
      </div>

      <div className="w-full mx-auto mt-8 pb-8 grid auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <BigButton
          Icon={ApplicationIcon}
          title="Application"
          subTitle="Start your general application"
          href={`/platform/trips/${tripId}/application`}
        />
        <BigButton
          Icon={MatchbookVerified}
          title="Matchbook Verification"
          subTitle="Start your screening"
          iconClassName="scale-110"
          href={`/platform/trips/${tripId}/verification`}
        />
        <BigButton
          Icon={DeniedIcon}
          title="Disliked Properties"
          subTitle="View your disliked properties"
          href={`/platform/trips/${tripId}/dislikes`}
        />
        <BigButton
          Icon={DeclinedApplicationIcon}
          title="Declined Applications"
          subTitle="View your declined applications"
          href={`/platform/trips/${tripId}/declined`}
        />
      </div>
    </>
  );
};

export default OverviewTab;

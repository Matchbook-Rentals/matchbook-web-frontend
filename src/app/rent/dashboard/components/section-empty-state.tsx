'use client';

import Image from 'next/image';

interface SectionEmptyStateProps {
  imageSrc: string;
  title: string;
  imageSize?: number;
}

export const SectionEmptyState = ({
  imageSrc,
  title,
  imageSize = 64,
}: SectionEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-10">
    <Image
      src={imageSrc}
      alt=""
      width={imageSize}
      height={imageSize}
      className="mb-3 opacity-80"
    />
    <p className="font-poppins font-medium text-sm text-[#484a54]">{title}</p>
  </div>
);

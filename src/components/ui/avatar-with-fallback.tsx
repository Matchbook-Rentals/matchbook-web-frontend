'use client';

import React, { useState } from 'react';
import { getImageWithFallback } from '@/lib/utils';

interface AvatarWithFallbackProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  alt?: string;
  className?: string;
  size?: number;
  bgColor?: string;
  textColor?: string;
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  firstName,
  lastName,
  email,
  alt = 'Avatar',
  className = '',
  size = 400,
  bgColor = '0B6E6E',
  textColor = 'FFF'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If there's no src or if image failed to load, use fallback
  const shouldUseFallback = !src || imageError;
  
  const fallbackSrc = getImageWithFallback(
    shouldUseFallback ? null : src,
    firstName,
    lastName,
    email,
    size
  );

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <img
      src={shouldUseFallback ? fallbackSrc : src}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default AvatarWithFallback;
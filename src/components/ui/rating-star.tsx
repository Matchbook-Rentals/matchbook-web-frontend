import React from 'react';

const RatingStar = ({ rating, size = 24 }) => {
  // Ensure rating is between 1 and 5
  const clampedRating = Math.max(1, Math.min(5, rating));
  
  // Calculate fill percentage (now 0% at rating 1, 100% at rating 5)
  const fillPercentage = ((clampedRating - 1) / 4) * 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }} // Removes any default inline spacing
    >
      <defs>
        <linearGradient id={`starGradient-${rating}`}>
          <stop offset={`${fillPercentage}%`} stopColor="#FFD700" />
          <stop offset={`${fillPercentage}%`} stopColor="#E5E7EB" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={`url(#starGradient-${rating})`}
        stroke="#D1D5DB"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Demo component to showcase different ratings

export default RatingStar;

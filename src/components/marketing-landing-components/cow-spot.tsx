import React from "react";

interface CowSpotProps {
  direction: 'northeast' | 'southeast' | 'southwest' | 'northwest';
  className?: string;
}

export default function CowSpot({ direction, className = "" }: CowSpotProps) {
  const getPositionClasses = () => {
    switch (direction) {
      case 'northeast':
        return 'top-0 right-0 translate-x-1/2 -translate-y-1/2';
      case 'southeast':
        return 'bottom-0 right-0 translate-x-1/2 translate-y-1/2';
      case 'southwest':
        return 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2';
      case 'northwest':
        return 'top-0 left-0 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-0 right-0 translate-x-1/2 translate-y-1/2';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} ${className}`}>
      {/* Cow spot shape - perfect circle for northeast, irregular for others */}
      <svg
        width="240"
        height="180"
        viewBox="0 0 60 45"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {direction === 'northeast' ? (
          <circle
            cx="30"
            cy="22.5"
            r="25"
            fill="#e7f0f0"
            fillOpacity="0.5"
          />
        ) : (
          <path
            d="M18 12C14 14 12 18 13 22C14 26 18 27 22 26C25 28 28 30 32 28C35 26 36 23 35 20C34 17 31 16 28 17C26 14 22 13 18 12Z"
            fill="#e7f0f0"
            fillOpacity="0.5"
          />
        )}
      </svg>
    </div>
  );
}
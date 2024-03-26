import React from 'react';

const PlusIcon = ({ size = 6, color = 'text-gray-700' }) => {
  // Size class mapping for Tailwind, defaulting to w-6 h-6
  const sizeClass = `w-${size} h-${size}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} rounded-full`} viewBox="0 0 21 47" fill={`${color}`}>
      <text
        id="_"
        data-name="+"
        transform="translate(1 36)"
        className={`${color} stroke-current`} // Apply text color using Tailwind and stroke-current for stroke color
        strokeWidth="1"
        fontSize="35"
        fontFamily="Lora-Regular, Lora"
      >
        <tspan x="0" y="0">+</tspan>
      </text>
    </svg>
  );
};

export default PlusIcon;

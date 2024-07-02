import React from 'react';

interface TitleAndStatsProps {
  title?: string;
  rating?: number;
  numStays?: number;
  rentPerMonth?: number;
  numBeds?: number;
  numBath?: number;
  distance?: number;
}

const TitleAndStats: React.FC<TitleAndStatsProps> = ({
  title,
  rating,
  numStays,
  rentPerMonth,
  numBeds,
  numBath,
  distance,
}) => {
  return (
// Fixed syntax errors and formatting
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  {title && <h2 style={{ margin: 0 }}>{title}</h2>}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
    {rating !== undefined && <span>⭐ {rating}</span>}
    {numStays !== undefined && <span>🏠 {numStays} stays</span>}
    {rentPerMonth !== undefined && <span>💰 ${rentPerMonth}/month</span>}
    {numBeds !== undefined && <span>🛏️ {numBeds} beds</span>}
    {numBath !== undefined && <span>🚿 {numBath} baths</span>}
    {distance !== undefined && <span>📍 {distance} miles away</span>}
  </div>
</div>
  );
};

export default TitleAndStats;

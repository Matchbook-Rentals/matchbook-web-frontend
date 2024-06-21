import React from 'react';

interface DayProps {
  day: number;
}

const Day: React.FC<DayProps> = ({ day }) => {
  return (
    <div className="h-12 flex items-center justify-center border transition transition-colors transition-delay-800 hover:bg-gray-100">
      {day}
    </div>
  );
};

export default Day;
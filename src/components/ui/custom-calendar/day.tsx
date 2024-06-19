import React from 'react';

interface DayProps {
  day: number;
}

const Day: React.FC<DayProps> = ({ day }) => {
  return (
    <div className="h-12 flex items-center justify-center border">
      {day}
    </div>
  );
};

export default Day;
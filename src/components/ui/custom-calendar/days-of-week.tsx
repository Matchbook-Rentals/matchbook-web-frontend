import React from 'react';

const DaysOfWeek = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-7 bg-gray-100 py-2">
      {daysOfWeek.map(day => (
        <div key={day} className="text-center font-semibold">
          {day}
        </div>
      ))}
    </div>
  );
};

export default DaysOfWeek;

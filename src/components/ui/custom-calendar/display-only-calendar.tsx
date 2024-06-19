import React, { useState } from 'react';
import Header from './calendar-header';
import DaysOfWeek from './days-of-week';
import Days from './days';

const DisplayCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="w-[95%] mx-auto  border-2 shadow-lg rounded-lg overflow-hidden">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <DaysOfWeek />
      <Days currentDate={currentDate} />
    </div>
  );
};

export default DisplayCalendar;

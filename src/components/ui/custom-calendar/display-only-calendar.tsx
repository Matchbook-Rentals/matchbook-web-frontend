import React, { useState } from 'react';
import Header from './calendar-header';
import ColumnHeaders from './column-headers';
import Days from './day-grid';

const DisplayCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="w-[95%] mx-auto  border-2 shadow-lg rounded-lg overflow-hidden">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <ColumnHeaders />
      <Days currentDate={currentDate} />
    </div>
  );
};

export default DisplayCalendar;

import React, { useState } from 'react';
import Header from './Header';
import DaysOfWeek from './DaysOfWeek';
import Days from '../date-range-selector/date-range-days';

const GenericCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="w-80 mx-auto bg-dark shadow-lg rounded-lg overflow-hidden">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      <DaysOfWeek />
      <Days currentDate={currentDate} />
    </div>
  );
};

export default GenericCalendar;

import React from "react";

const GenericDayGrid = ({ currentDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <div key={day} className="h-12 flex items-center justify-center border">
        {day}
      </div>,
    );
  }

  return <div className="grid grid-cols-7 gap-1 p-2">{days}</div>;
};

export default GenericDayGrid;

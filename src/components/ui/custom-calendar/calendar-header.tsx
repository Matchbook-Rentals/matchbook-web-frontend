import React from "react";

const Header = ({ currentDate, setCurrentDate }) => {
  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="flex justify-between items-center  py-2 px-4 border-b">
      <button
        className="bg-transparent text-gray-700 font-semibold hover:text-gray-900 focus:outline-none"
        onClick={() =>
          setCurrentDate(
            new Date(currentDate.setMonth(currentDate.getMonth() - 1)),
          )
        }
      >
        Prev
      </button>
      <h2 className="text-lg font-semibold">{`${month} ${year}`}</h2>
      <button
        className="bg-transparent text-gray-700 font-semibold hover:text-gray-900 focus:outline-none"
        onClick={() =>
          setCurrentDate(
            new Date(currentDate.setMonth(currentDate.getMonth() + 1)),
          )
        }
      >
        Next
      </button>
    </div>
  );
};

export default Header;

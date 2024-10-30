"use client";
import React, { useState, useEffect } from "react";

// Add className to the component props
const Countdown: React.FC<{ className?: string }> = ({ className }) => {
  const targetDate = new Date("2025-03-01T00:00:00");
  const [timeLeft, setTimeLeft] = useState<Record<string, number | string>>({
    days: "??",
    hours: "??",
    minutes: "??",
    seconds: "??",
  });

  useEffect(() => {
    function calculateTimeLeft() {
      const difference = +targetDate - +new Date();
      let newTimeLeft: Record<string, number | string> = {};

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return newTimeLeft;
    }

    function updateTimeLeft() {
      setTimeLeft(calculateTimeLeft());
    }

    updateTimeLeft(); // Initial calculation
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeComponents = Object.keys(timeLeft).map((interval) => {
    if (!timeLeft[interval]) {
      return null;
    }

    return (
      <span key={interval} className="">
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  return (
    <div
      className={`text-lg xs:text-xl mx-auto  py-1 pl-9  xs:pl-11  font-semibold text-black text-left w-full max-w-[700px] ${className || ""}`} >
      <h1 className="text-2xl xs:text-3xl sm:text-4xl text-left  mt-8 xs:mt-2 mb-4 font-semibold">Get ready for launch!</h1>
      <h2 className="pl-[1px]"> Find your place, all in once place in: </h2>
      <div className="flex pt-6 justify-start gap-x-4">
        {Object.keys(timeLeft).map((interval) => (
          <div
            key={interval}
            className="flex flex-col xs:flex-row gap-x-1 justify-start items-center xs:items-end"
          >
            <span className="text-2xl font-semibold text-charcoal">
              {timeLeft[interval]}
            </span>
            <span className="text-[16px] text-muted-foreground ">{interval}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;

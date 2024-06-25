'use client'
import React, { useState, useEffect } from 'react';

// Add className to the component props
const Countdown: React.FC<{ className?: string }> = ({ className }) => {
  const targetDate = new Date('2025-02-01T00:00:00');
  const [timeLeft, setTimeLeft] = useState<Record<string, number | string>>({
    days: '??',
    hours: '??',
    minutes: '??',
    seconds: '??'
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
      <span key={interval} className="mx-2">
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  return (
    <div className={`text-4xl font-semibold text-black ${className || ''}`}>
      Find your place all in once place, new row
      <div className="flex  pt-6 justify-evenly">
        {Object.keys(timeLeft).map((interval) => (
          <div key={interval} className="flex flex-col justify-center items-center">
            <span className="text-4xl text-white font-semibold">{timeLeft[interval]}</span>
            <span className="text-4xl">{interval}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;

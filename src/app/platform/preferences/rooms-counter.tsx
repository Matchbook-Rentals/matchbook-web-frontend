"use client";
import Counter from "@/components/home-components/counter";
import React, { useState } from "react";

interface RoomsCounterProps {
  goToNext: () => void;
  goToPrev: () => void;
  setUserPreferences: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual preference type you expect
}

const RoomsCounter: React.FC<RoomsCounterProps> = ({
  goToNext,
  goToPrev,
  setUserPreferences,
}) => {
  const [bedroomCount, setBedroomCount] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);

  const handleNext = () => {
    setUserPreferences((prev) => {
      return { ...prev, bedroomCount, bathroomCount };
    });
    goToNext();
  };

  return (
    <>
      <h2 className=" text-center text-2xl my-10 font-semibold">
        What kind of place are you looking for?
      </h2>
      <div className="card border border-black flex flex-col w-1/2 mx-auto mt-5 rounded-2xl">
        <Counter
          hasBorder
          label={"Bedrooms"}
          count={bedroomCount}
          onDecrement={() => setBedroomCount((prev) => prev - 1)}
          onIncrement={() => setBedroomCount((prev) => prev + 1)}
        />
        <Counter
          hasBorder={false}
          label={"Bathrooms"}
          count={bathroomCount}
          onDecrement={() => setBathroomCount((prev) => prev - 1)}
          onIncrement={() => setBathroomCount((prev) => prev + 1)}
        />
      </div>
      <div className="flex gap-2 justify-center mt-5">
        <button
          className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg"
          onClick={goToPrev}
        >
          BACK
        </button>
        <button
          className="bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg"
          onClick={handleNext}
        >
          NEXT
        </button>
      </div>
    </>
  );
};

export default RoomsCounter;

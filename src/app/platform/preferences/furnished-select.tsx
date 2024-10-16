"use client";
import React, { useState } from "react";
import { CheckboxDemo } from "./custom-checkbox";

interface FurnishedSelectProps {
  goToNext: () => void;
  goToPrev: () => void;
  setUserPreferences: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual preference type you expect
}

const FurnishedSelect: React.FC<FurnishedSelectProps> = ({
  goToNext,
  goToPrev,
  setUserPreferences,
}) => {
  const [isFurnished, setIsFurnished] = useState();

  const handleNext = () => {
    setUserPreferences((prev) => {
      return { ...prev, furnished: isFurnished === "Furnished" ? true : false };
    });
    goToNext();
  };

  return (
    <>
      <h2 className=" text-center text-2xl my-10 font-semibold">
        Are you looking for a furnished stay?
      </h2>
      <div className="card border border-black flex flex-col w-1/2 mx-auto mt-5 rounded-2xl p-5">
        {/* <CheckedRadio /> */}
        <CheckboxDemo
          key="furnished"
          justifyDirection="between"
          label="Furnished"
          isChecked={isFurnished === "Furnished"}
          details={{ id: "Furnished" }}
          handleChange={setIsFurnished}
          hasBorder
        />
        <CheckboxDemo
          key="unfurnished"
          justifyDirection="between"
          label="Unfurnished"
          isChecked={isFurnished === "Unfurnished"}
          details={{ id: "Unfurnished" }}
          handleChange={setIsFurnished}
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

export default FurnishedSelect;

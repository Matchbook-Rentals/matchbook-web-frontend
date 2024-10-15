import React from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";

const Hero: React.FC = () => {
  return (
    <div className="relative  mx-auto flex flex-col items-center px-12 bg-cover justify-start" style={{ backgroundImage: "url('/hero-image.png')" }}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-400 opacity-50"></div>

      {/* Content */}
      <SearchContainer className="pt-[10%]  w-[80%] relative " />
      <Countdown className="z-20 mt-8" />
    </div>
  );
};

export default Hero;

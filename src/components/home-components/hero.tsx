import React from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[60vh] w-full md:w-[90vw] lg:w-[80vw] mx-auto flex flex-col items-center px-4 sm:px-8 md:px-12 bg-cover justify-start" style={{ backgroundImage: "url('/hero-image.png')" }}>

      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-gray-400 opacity-50"></div> */}

      {/* Content */}
      <SearchContainer className="md:pt-[5%] pt-[15%] sm:w-[90%] md:w-[70%] relative" />
    </div>
  );
};

export default Hero;

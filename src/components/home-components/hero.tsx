import React from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";

const Hero: React.FC = () => {
  return (
    <div
      className="relative min-h-[60vh]  rounded-lg shadow-md w-[100vw] mx-auto flex flex-col items-center px-4 sm:px-8 md:px-12 bg-cover justify-start"
      style={{
        backgroundImage: "url('/treelined-street-with-beautifully-restored-victorian-home.jpg')",
        backgroundSize: "cover", // Ensures the image covers the container
        backgroundPosition: "center", // Centers the image so it crops equally from all sides
      }}
    >
      {/* Overlay */}
      {/* <div className="absolute inset-0 bg-gray-400 opacity-50"></div> */}

      {/* Content */}
                  <SearchContainer
                    className="z-100 sm:w-[90%] lg:w-[80%] pt-[6%]"
                    containerStyles='bg-background rounded-[15px] drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
                    inputStyles='bg-background'
                    searchButtonClassNames='border border-[#404040] md:border-none bg-background hover:bg-gray-200'
                    searchIconColor='text-[#404040]'
                    popoverMaxWidth='900px'
                  />
    </div>
  );
};

export default Hero;

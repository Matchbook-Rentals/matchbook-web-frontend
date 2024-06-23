import React from "react";
import Image from "next/image";
import SearchContainer from "./searchContainer";
import { Trip } from "@/types";


const Hero: React.FC = () => {
  return (
    <div className="relative h-[70vh] flex items-center justify-center text-white">
      {/* Background image */}
      <Image
        src="/paul-weaver-hero.jpg"
        layout="fill"
        objectFit="cover"
        quality={100}
        alt="Background"
        className="absolute z-0"
      />
      {/* Overlay */}
      <div className="absolute bg-black bg-opacity-50 inset-0 z-10" />
      {/* Text */}
      <div className="relative translate-y-[-130%] z-20 lg:w-[55vw] md:w-[70vw] w-full">
        <SearchContainer />
      </div>
    </div>
  );
};

export default Hero;

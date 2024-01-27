import React from 'react'
import Image from "next/image";
import Container from '../container';
import SearchContainer from './searchContainer';

export default function Hero() {
  return (
    <div className="relative h-[70vh] flex items-center justify-center text-white">
      {/* Background image */}
      <Image
        src="/paul-weaver-hero.jpg" // Replace with the path to your image
        layout="fill"
        objectFit="cover"
        quality={100}
        alt="Background"
        className="absolute z-0" // Ensures the image is in the background
      />
      {/* Overlay */}
      <div className="absolute bg-black bg-opacity-50 inset-0 z-10" />
      {/* Text */}
      <div className="relative translate-y-[-160%] z-20 w-[40vw]">
        <SearchContainer />
      </div>
    </div>
  )
}

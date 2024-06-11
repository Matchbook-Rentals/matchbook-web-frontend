"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const SlidingHeart: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false); // State to check if component is mounted

  useEffect(() => {
    setMounted(true); // Component is mounted
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`flex justify-center ${mounted && !scrolled ? 'translate-y-8' : ''} transition-transform duration-300`}>
      <Image
        src={"/heart-logo.png"}
        alt="logo"
        width={60}
        height={60}
        className=""
      />
    </div>
  );
};

export default SlidingHeart;

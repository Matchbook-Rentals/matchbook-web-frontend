import React, { useEffect, useState } from "react";
import { UserIcon, MenuIcon } from "@/components/svgs/svg-components";
import Link from "next/link";

export default function MatchbookHeader() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  const translateY = Math.max(-30, Math.min((scrollY - 50) / 2, 0));



  return (
    // Updated transition classes for a 3-second duration
    <div className={`sticky mb-20 top-0 bg-background transition-all duration-100 ease-in z-30 pb-0`}>
      <header
        className={`relative flex mb-6 px-4 sm:px-12 md:px-16 lg:px-30 xl:px-36 2xl:px-44 justify-between pt-4 items-start border-b-0 pb-2`}
      >
        <div className="flex items-center">
          <Link href={"/"}>
          <img src="logo-nav-new.png" alt="MatchBook Logo" className="hidden sm:block w-full h-14" />
          <img src="House_Logo.png" alt="MatchBook Heart" className="sm:hidden h-10 w-10" />
          </Link>
        </div>
        <div
          className="absolute inset-x-0 bottom-2 rounded-full hidden md:flex justify-center md:w-[70px] lg:w-[100px] mx-auto bg-background"
          style={{
            transform: `translateY(${-translateY}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <img src="/svg/heart-header.svg" className="h-14 w-14 heart" alt="MatchBook Heart" />
        </div>
        <div className="flex md:space-x-4 items-center">
          <MenuIcon className="h-12 w-12 md:h-14 md:w-14" />
          <UserIcon className="h-12 w-10 md:h-14 md:w-14" />
        </div>
        <style jsx>{`
          header::before {
            content: '';
            position: absolute;
            bottom: 00%;
            left: 0;
            right: 0;
            height: 1px;
            background-color: lightgray;
          }
          .heart::before {
            content: '';
            position: absolute;
            bottom: 25%;
            left: -25px;
            right: -25px;
            height: 30px;
            background-color: red;
            z-index: 1;
          }
        `}</style>
      </header>
    </div>
  );
}

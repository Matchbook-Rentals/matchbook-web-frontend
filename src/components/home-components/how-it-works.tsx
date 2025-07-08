import React from "react";
import Image from "next/image";

export const HowItWorks = (): JSX.Element => {
  return (
    <section className="w-full  flex justify-center items-center ">
      <div 
        className="flex flex-col items-center relative"
        style={{
          width: '1441px',
          paddingTop: '0px',
          paddingRight: '10%',
          paddingBottom: '50px',
          paddingLeft: '10%',
          gap: '56px'
        }}
      >
        <header className="text-center">
          <h1 className="font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] tracking-[-2.00px] leading-normal">
            How MatchBook Works
          </h1>
        </header>
        
        <div className="w-full flex items-center justify-center relative">
          <Image
            src="/marketing-images/Pasted image.png"
            alt="How MatchBook Works"
            width={1200}
            height={600}
            className="max-w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            quality={85}
            priority
          />
        </div>
      </div>
    </section>
  );
};

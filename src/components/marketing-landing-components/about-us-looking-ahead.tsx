import React from "react";

export const AboutUsLookingAhead = (): JSX.Element => {
  return (
    <>
      {/* Desktop Layout */}
      <section className="hidden md:block relative w-full h-[488px] overflow-hidden" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="relative w-full max-w-[1440px] mx-auto h-full flex items-center justify-center">
          {/* Text blob image */}
          <div className="h-full max-w-[1000px] flex items-center justify-center">
            <img
              className="w-auto h-auto max-w-full lg:pl-[25px] max-h-full object-cover"
              alt="Looking Ahead text"
              src="/about-us/looking-ahead/Text-blob-new.png"
            />
          </div>

          {/* Professional photo - positioned to overlap half on/half off the blob */}
          <img
            className="absolute left-1/2 bottom-0 z-10 w-[325px] md:w-[250px] lg:w-[325px] object-cover sm:-translate-x-[170%]  lg:-translate-x-[150%]"
            alt="Professional in suit"
            src="/about-us/looking-ahead/1.png"
          />
        </div>
      </section>

      {/* Mobile Layout */}
      <div className="md:hidden w-full">
        <img
          className="w-full h-auto object-cover"
          alt="Looking Ahead"
          src="/about-us/looking-ahead/3-new.png"
        />
      </div>
    </>
  );
};

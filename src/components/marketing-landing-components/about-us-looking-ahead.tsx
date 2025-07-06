import React from "react";

export const AboutUsLookingAhead = (): JSX.Element => {
  return (
    <>
      {/* Desktop Layout */}
      <section className="hidden xl:block relative w-full h-[488px] overflow-hidden" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="relative w-full max-w-[1440px] mx-auto h-full flex items-end">
          {/* Professional photo */}
          <img
            className="relative left-[15%]  z-10 w-[325px] object-cover"
            alt="Professional in suit"
            src="/about-us/looking-ahead/1.png"
          />

          {/* Text blob image */}
          <div className="absolute right-[5%] w-[70%] h-full min-w-[1000px] flex items-center justify-center">
            <img
              className="w-auto h-auto max-w-full max-h-full object-contain"
              alt="Looking Ahead text"
              src="/about-us/looking-ahead/Text blob.png"
            />
          </div>
        </div>
      </section>

      {/* Mobile Layout */}
      <div className="xl:hidden w-full overflow-hidden" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="relative w-full max-h-[80vh] flex flex-col">
          {/* Background with constrained height */}
          <div className="relative w-full h-full max-h-[60vh]">
            <img
              className="w-full h-full object-cover"
              alt="Background shape"
              src="/about-us/looking-ahead/mobile-cowspot.png"
            />
            
            {/* Text content positioned over the cowspot */}
            <div className="absolute inset-0 flex flex-col justify-center items-center px-2 md:px-6">
              <div className="text-center text-white  space-y-4">
                <h2 className="font-['Poppins',Helvetica] font-medium text-[calc(1.5rem+1vw)] tracking-tight leading-normal">
                  Looking Ahead
                </h2>

                <p className="text-[calc(0.875rem+0.5vw)] leading-relaxed  mx-auto">
                  We&#39;re gearing up for our big debut and have been chatting with
                  loads of awesome people to make sure we&#39;re on the right track.
                  Their stories, laughs, and nuggets of wisdom have been the secret
                  sauce in shaping MatchBook. We&#39;re beyond excited to launch a
                  platform that doesn&#39;t just meet your needs but makes you
                  wonder how you ever lived without it.
                </p>
              </div>
            </div>
          </div>

          {/* Professional image with responsive sizing */}
          <div className="relative w-full flex justify-center -mt-[15%]">
            <img
              className="w-[calc(12rem+8vw)] max-w-[280px] h-auto object-cover z-10"
              alt="Professional in suit"
              src="/about-us/looking-ahead/1.png"
            />
          </div>
        </div>
      </div>
    </>
  );
};

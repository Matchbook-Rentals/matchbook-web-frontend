import React from "react";

interface AboutUsLookingAheadTextBubbleProps {
  className?: string;
}

export const AboutUsLookingAheadTextBubble: React.FC<AboutUsLookingAheadTextBubbleProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Background vector shape */}
      <img
        className="w-full h-full object-contain"
        alt="Background shape"
        src="/about-us/looking-ahead/vector.svg"
      />
      
      {/* Top left white vector overlay */}
      <img
        className="absolute top-[-10%] left-[20%] w-[30%] h-[50%] object-contain opacity-15"
        alt="Background shape overlay"
        src="/about-us/looking-ahead/vector.svg"
        style={{ filter: 'brightness(0) invert(1)', transform: 'rotate(180deg)' }}
      />

      {/* Text content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-[80%] mt-[8%] px-2 text-center">
          <h2 className="font-['Poppins',Helvetica] font-medium text-white text-[40px] tracking-[-2.00px] leading-normal">
            Looking Ahead
          </h2>

          <p className="text-white pl-2 pr-12 pt-10 text-lg leading-relaxed">
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
  );
};
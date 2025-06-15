import React from "react";

interface SpeechBubbleProps {
  imageSrc: string;
  angle?: number;
  horizontalReflection?: boolean;
  className?: string;
  bubblePosition?: 'top' | 'bottom';
}

export default function SpeechBubble({
  imageSrc,
  angle = 0,
  horizontalReflection = false,
  className = "",
  bubblePosition = 'bottom',
}: SpeechBubbleProps): JSX.Element {
  const isBottomBubble = bubblePosition === 'bottom';
  
  // Determine direction based on angle
  const isEastDirection = angle === 180 || angle === 270; // Northeast or Southeast
  const isCenterCard = angle === 135; // True north center card
  const horizontalOffset = isCenterCard ? 'left-1/2 -translate-x-1/2 ml-[5px]' : 
                          isEastDirection ? 'right-[-25px]' : 'left-[-25px]';
  const verticalOffset = isCenterCard ? 'top-[52px]' : // Half the container height (95px/2) + 5px down
                        isBottomBubble ? 'top-[-15px]' : 'bottom-[-15px]';
  
  return (
    <div className={`absolute w-[111px] h-[95px] ${className}`}>
      {/* Small decorative bubbles */}
      <div 
        className={`absolute w-8 h-[39px] left-[49px] ${isCenterCard ? 'top-[128px]' : isBottomBubble ? 'top-[56px]' : 'top-0'}`}
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <div className="absolute w-6 h-6 top-[15px] left-0">
          <div className="w-4 h-4 top-2 left-0 rounded-lg absolute bg-[#d9d9d9]" />
          <div className="w-2.5 h-2.5 top-0 left-3.5 rounded-[5px] absolute bg-[#d9d9d9]" />
        </div>
        <div className="w-1.5 h-1.5 top-[9px] left-6 rounded-[3px] absolute bg-[#d9d9d9]" />
      </div>
      
      {/* Main thought bubble with image */}
      <div className={`absolute w-[109px] h-[70px] ${verticalOffset} ${horizontalOffset}`}>
        <div className="relative w-[109px] h-[70px] -top-px -left-px">
          {/* Inner image */}
          <img
            className={`absolute w-[51px] h-[45px] top-3.5 left-[22px] object-cover ${
              horizontalReflection ? "scale-x-[-1]" : ""
            }`}
            alt="Bubble content"
            src={imageSrc}
          />
          {/* Thought bubble SVG */}
          <img
            className="absolute w-[109px] h-[70px] top-0 left-0"
            alt="Thought bubble"
            src="/svg/thought-bubble.svg"
          />
        </div>
      </div>
    </div>
  );
}
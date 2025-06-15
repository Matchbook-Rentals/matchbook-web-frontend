import React from "react";
import { Card, CardContent } from "../ui/card";
import SpeechBubble from "./speech-bubble";
import CowSpot from "./cow-spot";

interface FeatureCardProps {
  title: string;
  description: string;
  speechBubble?: {
    imageSrc: string;
    position: string;
    angle: number;
    horizontalReflection?: boolean;
    bubblePosition?: 'top' | 'bottom';
  };
  isCenter?: boolean;
  cowSpots?: Array<'northeast' | 'southeast' | 'southwest' | 'northwest'>;
}

export default function FeatureCard({ title, description, speechBubble, isCenter, cowSpots }: FeatureCardProps) {
  return (
    <Card className="relative h-full rounded-xl border border-solid border-[#c1c1c1] overflow-visible">
      <CardContent className={`relative z-10 p-4 h-full ${isCenter ? 'flex items-center justify-center' : 'flex flex-col justify-start'}`}>
        <div className={`flex flex-col items-start gap-1 ${isCenter ? 'flex-1' : ''}`}>
          <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[16px] leading-[130%] tracking-[0px] text-[#384250] ${isCenter ? 'text-center w-full' : ''}`}>
            {title}
          </h3>
          <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px] leading-[130%] tracking-[0px] text-[#6C737F] ${isCenter ? 'text-center w-full' : 'text-left'}`}>
            {description}
          </p>
        </div>
      </CardContent>
      
      {/* Cow spots container with overflow hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {cowSpots && cowSpots.map((direction, index) => (
          <CowSpot key={index} direction={direction} />
        ))}
      </div>
      
      {/* Speech bubble positioned relative to card */}
      {speechBubble && (
        <SpeechBubble
          imageSrc={speechBubble.imageSrc}
          angle={speechBubble.angle}
          horizontalReflection={speechBubble.horizontalReflection}
          bubblePosition={speechBubble.bubblePosition}
          className={speechBubble.position}
        />
      )}
    </Card>
  );
}

import React from "react";
import { Card, CardContent } from "../ui/card";
import SpeechBubble from "./speech-bubble";

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
}

export default function FeatureCard({ title, description, speechBubble, isCenter }: FeatureCardProps) {
  return (
    <Card className={`relative flex-1 rounded-xl border border-solid border-[#c1c1c1] overflow-visible ${isCenter ? 'h-full' : ''}`}>
      <CardContent className={`p-3 ${isCenter ? 'flex items-center justify-center h-full' : ''}`}>
        <div className={`flex flex-col items-start gap-1 ${isCenter ? 'flex-1' : ''}`}>
          <h3 className={`mt-[-1.00px] font-text-label-medium-medium font-[number:var(--text-label-medium-medium-font-weight)] text-gray-neutral700 text-[length:var(--text-label-medium-medium-font-size)] tracking-[var(--text-label-medium-medium-letter-spacing)] leading-[var(--text-label-medium-medium-line-height)] [font-style:var(--text-label-medium-medium-font-style)] ${isCenter ? 'text-center w-full' : ''}`}>
            {title}
          </h3>
          <p className={`font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-gray-neutral500 text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)] ${isCenter ? 'text-center w-full' : ''}`}>
            {description}
          </p>
        </div>
      </CardContent>
      
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
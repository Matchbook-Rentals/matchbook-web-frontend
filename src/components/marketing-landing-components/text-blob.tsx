import React from "react";

export const TextBlob = (): JSX.Element => {
  return (
    <div className="relative">
      {/* Background blob */}
      <img
        className="absolute h-[80%] top-10 left-[37px] scale-[]"
        alt="Background shape"
        src="/marketing-images/reviews-section/Vector.png"
      />

      {/* Text content positioned exactly as in original */}
      <div className="flex flex-col w-[565px] items-center gap-4 absolute top-[370px] left-[189px]">
        <h1 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
          Real Reviews, Reliable Renters, Worry-Free Renting
        </h1>

        <p className="relative self-stretch font-text-heading-xsmall-regular font-[number:var(--text-heading-xsmall-regular-font-weight)] text-gray-neutral600 text-[length:var(--text-heading-xsmall-regular-font-size)] text-center tracking-[var(--text-heading-xsmall-regular-letter-spacing)] leading-[var(--text-heading-xsmall-regular-line-height)] [font-style:var(--text-heading-xsmall-regular-font-style)]">
          Choose renters you can trust. Our review system gives you insight
          into their past rentals, making worry-free renting a reality.
        </p>
      </div>
    </div>
  );
};
import React from "react";

export const PersonalInformationSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-start gap-1 mb-6">
      <p className="tracking-[-0.28px] leading-[normal] [font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
        This screening includes a credit range, background check, and eviction
        history.
      </p>
    </section>
  );
};

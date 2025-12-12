import React from "react";

export const PersonalInformationSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-start gap-1">
      <h1 className="font-text-heading-medium-medium text-[#373940] text-[20px] md:text-[28px] font-medium leading-normal">
        MatchBook Renter Verification
      </h1>
      <p className="font-['Poppins',Helvetica] text-sm text-[#5d606d] font-normal">
        This includes a credit range, background check, and eviction
        history.
      </p>
    </section>
  );
};

import React from "react";
import { RenterVerificationSection } from "./sections/RenterVerificationSection";
import { ScreeningResultsSection } from "./sections/ScreeningResultsSection";

export const VerificationDetailsScreen = (): JSX.Element => {
  return (
    <main className="flex flex-col w-full items-start relative gap-4 md:gap-6 p-2 md:p-4">
      <RenterVerificationSection />
      <ScreeningResultsSection />
    </main>
  );
};

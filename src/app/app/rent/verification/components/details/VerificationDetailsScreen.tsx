import React from "react";
import { RenterVerificationSection } from "./sections/RenterVerificationSection";
import { ScreeningResultsSection } from "./sections/ScreeningResultsSection";

export const VerificationDetailsScreen = (): JSX.Element => {
  return (
    <main className="flex flex-col w-full items-start relative">
      <RenterVerificationSection />
      <ScreeningResultsSection />
    </main>
  );
};

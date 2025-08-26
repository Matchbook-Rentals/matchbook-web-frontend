import React from "react";
import { SearchContainerSection } from "./sections/SearchContainerSection/SearchContainerSection";
import { SearchResultsSection } from "./sections/SearchResultsSection/SearchResultsSection";

export const Body = (): JSX.Element => {
  return (
    <main className="flex flex-col items-start gap-6 px-6 py-8 relative bg-[#f9f9f9]">
      <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <SearchResultsSection />
        <SearchContainerSection />
      </div>
    </main>
  );
};

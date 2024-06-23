import React from "react";
import SearchContainer from "./searchContainer";

const Hero: React.FC = () => {
  return (
    <div className="h-[60vh] w-[80vw] mx-auto flex flex-col items-center px-12 bg-cover justify-start" style={{ backgroundImage: "url('/temp-header-cozy-couch.png')" }}>
      {/* Content */}
      <SearchContainer className="pt-[10%] w-[80%]" />
    </div>
  );
};

export default Hero;

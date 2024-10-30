"use client";

import React from "react";

const BREVO_FORM_URL =
  "https://2ad770f1.sibforms.com/serve/" +
  "MUIFAHcHg4cAoKga0ovVndvaqvTLm79G59UuyemMwyOJeTyPhUNp-g6LmJbH4rrhKx7eJbw" +
  "IbJvtltohK9SDGDwSl0frYWavjdD1nDXykWCYRl2QncBtCCxkYkxW5Z2TTIMR1R1BEKkuRg" +
  "IVbHRwzmPUq0fsvydxbDT7RH90JklhBcHDRnTnRUWt-ae2ED9iofvTHC0D9WEJa5cc";

const BrevoIframe: React.FC = () => {
  return (
    <iframe
      src={BREVO_FORM_URL}
      className={
        "border-0 border-white focus:ring-0 focus:outline-none " +
        "w-full h-[800px] sm:h-[750px] overflow-y-scroll mt-[]"
      }
      title="Brevo Form"
    />
  );
};

export default BrevoIframe;

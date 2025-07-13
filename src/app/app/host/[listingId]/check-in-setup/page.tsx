import React from "react";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { CheckIn } from "./check-in-client";

export default function CheckInSetupPage() {
  return (
    <div className={HOST_PAGE_STYLE}>
      <CheckIn />
    </div>
  );
}
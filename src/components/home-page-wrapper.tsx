"use client";

import React from "react";
import SessionTracker from "./SessionTracker";

interface HomePageWrapperProps {
  children: React.ReactNode;
}

export const HomePageWrapper: React.FC<HomePageWrapperProps> = ({ children }) => {
  return (
    <>
      <SessionTracker />
      {children}
    </>
  );
};

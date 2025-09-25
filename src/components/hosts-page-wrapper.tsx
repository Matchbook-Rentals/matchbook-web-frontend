"use client";

import React from "react";

interface HostsPageWrapperProps {
  children: React.ReactNode;
}

export const HostsPageWrapper: React.FC<HostsPageWrapperProps> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};
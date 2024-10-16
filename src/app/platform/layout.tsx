import PlatformNavbar from "@/components/platform-components/platformNavbar";
import React from "react";

export default function ClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PlatformNavbar />
      <div className="">{children}</div>
    </>
  );
}

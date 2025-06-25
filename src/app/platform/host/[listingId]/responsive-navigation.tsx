"use client";

import React from "react";
import { useNavigationContent } from './useNavigationContent';

interface ResponsiveNavigationProps {
  listingId?: string;
}

export default function ResponsiveNavigation({ listingId }: ResponsiveNavigationProps) {
  const { NavigationContent } = useNavigationContent({ listingId });

  return (
    <div className="hidden md:block w-56 flex-shrink-0 sticky top-0 self-start">
      <NavigationContent />
    </div>
  );
}

// Export the hook for use in other components
export { useNavigationContent };
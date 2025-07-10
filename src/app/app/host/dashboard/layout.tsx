import React from "react";
import ResponsiveNavigation from "../[listingId]/responsive-navigation";
import { APP_PAGE_MARGIN } from "@/constants/styles";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={`${APP_PAGE_MARGIN} pt-6 pb-20 md:pb-6`}>
      <div className="flex gap-6">
        <ResponsiveNavigation />
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
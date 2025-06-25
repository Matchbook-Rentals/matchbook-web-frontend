import React from "react";

interface MarketingContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function MarketingContainer({ 
  children, 
  className = "", 
  fullWidth = false 
}: MarketingContainerProps): JSX.Element {
  const containerClasses = fullWidth
    ? "w-full"
    : "w-[calc(100%-30px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] lg:w-[79.17%] max-w-[1520px] mx-auto";

  return (
    <div className={`${containerClasses} ${className}`}>
      {children}
    </div>
  );
}

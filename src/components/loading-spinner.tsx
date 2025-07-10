import React from "react";

interface LoadingSpinnerProps {
  displayText?: string;
}

export default function LoadingSpinner({ displayText = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">{displayText}</p>
    </div>
  );
}
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  displayText?: string;
}

export default function LoadingSpinner({ displayText = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">{displayText}</p>
    </div>
  );
}
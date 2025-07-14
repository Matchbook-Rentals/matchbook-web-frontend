"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface HospitableConnectProps {
  isConnected: boolean;
}

export function HospitableConnect({ isConnected }: HospitableConnectProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    // This will redirect the user to the backend route to start the OAuth flow
    window.location.href = "/api/hospitable/connect";
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <p className="text-sm text-gray-600">Connected to Hospitable</p>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Connect to Hospitable
    </Button>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface HospitableConnectProps {
  isConnected: boolean;
}

export function HospitableConnect({ isConnected }: HospitableConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleConnect = () => {
    setIsLoading(true);
    // This will redirect the user to the backend route to start the OAuth flow
    window.location.href = "/api/hospitable/connect";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    
    try {
      const response = await fetch('/api/hospitable/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect from Hospitable');
      }

      toast({
        title: "Success!",
        description: data.message || "Disconnected from Hospitable successfully",
      });

      // Refresh the page to update the connection status
      router.refresh();

    } catch (error) {
      console.error('Hospitable disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: (error as Error).message || "Failed to disconnect from Hospitable. Please try again.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <p className="text-sm text-gray-600">Connected to Hospitable</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disconnecting...
            </>
          ) : (
            'Disconnect'
          )}
        </Button>
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

'use client';
import React, { useState } from "react";
import { BrandButton } from "@/components/ui/brandButton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ListingCreationSuccessProps {
  isSaveAndExit?: boolean;
  listingId?: string | null;
}

export default function ListingCreationSuccess({ isSaveAndExit = false, listingId }: ListingCreationSuccessProps) {
  const [isConnectingToHospitable, setIsConnectingToHospitable] = useState(false);
  const [isConnectedToHospitable, setIsConnectedToHospitable] = useState(false);
  const { toast } = useToast();

  const handleConnectToHospitable = async () => {
    if (!listingId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No listing ID available for Hospitable sync",
      });
      return;
    }

    setIsConnectingToHospitable(true);
    
    try {
      const response = await fetch('/api/hospitable/sync-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Hospitable');
      }

      setIsConnectedToHospitable(true);
      toast({
        title: "Success!",
        description: data.message || "Listing successfully connected to Hospitable",
      });
    } catch (error) {
      console.error('Hospitable connection error:', error);
      
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Not connected to Hospitable')) {
        toast({
          variant: "destructive",
          title: "Connect to Hospitable First",
          description: "Please connect your Hospitable account in Settings before syncing listings.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: errorMessage || "Failed to connect listing to Hospitable. Please try again.",
        });
      }
    } finally {
      setIsConnectingToHospitable(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-6">
        {isSaveAndExit ? "Listing Saved Successfully!" : "Listing Created Successfully!"}
      </h2>
      <p className="text-lg mb-8 max-w-lg">
        {isSaveAndExit 
          ? "Your listing has been saved as a draft. You can come back later to finish and submit it for approval."
          : "Our team will review your listing for approval in the next 24 hours. You'll receive a notification once your listing is approved."
        }
      </p>
      <div className="flex flex-col gap-4 items-center">
        <BrandButton 
          href="/app/host/dashboard/listings"
          size="xl"
          className="w-[200px]"
        >
          Go to Host Dashboard
        </BrandButton>
        
        {!isSaveAndExit && listingId && (
          <Button
            size="lg"
            className={`
              w-[240px] font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60
              ${isConnectedToHospitable 
                ? "border-[#45BA8E] text-[#45BA8E] hover:bg-[#45BA8E]/10 bg-[#45BA8E]/5 border-2" 
                : "bg-[#ed3c6a] hover:bg-[#d63459] text-white border-0"
              }
            `}
            onClick={handleConnectToHospitable}
            disabled={isConnectingToHospitable || isConnectedToHospitable}
          >
            {isConnectingToHospitable ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnectedToHospitable ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Connected to Hospitable
              </>
            ) : (
              'Connect this listing to Hospitable'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
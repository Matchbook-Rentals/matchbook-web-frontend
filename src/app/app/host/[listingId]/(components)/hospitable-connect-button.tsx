"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ListingAndImages } from '@/types';

interface HospitableConnectButtonProps {
  listing: ListingAndImages;
}

export const HospitableConnectButton: React.FC<HospitableConnectButtonProps> = ({ listing }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(!!listing.hospitablePropertyId);
  const { toast } = useToast();

  const handleConnectToHospitable = async () => {
    setIsConnecting(true);
    
    try {
      const response = await fetch('/api/hospitable/sync-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Hospitable');
      }

      setIsConnected(true);
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
      setIsConnecting(false);
    }
  };

  // Don't show if listing is not approved
  if (listing.approvalStatus !== 'approved') {
    return null;
  }

  return (
    <Button
      size="sm"
      variant={isConnected ? "outline" : "default"}
      className={`
        ${isConnected 
          ? "border-[#45BA8E] text-[#45BA8E] hover:bg-[#45BA8E]/10 bg-[#45BA8E]/5" 
          : "bg-[#ed3c6a] hover:bg-[#d63459] text-white border-0"
        } 
        font-medium shadow-sm transition-all duration-200 disabled:opacity-60
      `}
      onClick={handleConnectToHospitable}
      disabled={isConnecting || isConnected}
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Connected to Hospitable
        </>
      ) : (
        'Connect to Hospitable'
      )}
    </Button>
  );
};
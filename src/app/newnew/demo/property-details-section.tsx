'use client';

import { Button } from "@/components/ui/button";
import { Copy, Package, Calendar, Home, MapPin, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface PropertyDetailsSectionProps {
  title: string;
  imageSrc: string;
  address: string;
  startDate: Date;
  endDate: Date;
  numAdults: number;
  numChildren: number;
  numPets: number;
  bookingId?: string;
  matchId?: string;
  leaseDocumentId?: string | null;
}

export default function PropertyDetailsSection({
  title,
  imageSrc,
  address,
  startDate,
  endDate,
  numAdults,
  numChildren,
  numPets,
  bookingId,
  matchId,
  leaseDocumentId,
}: PropertyDetailsSectionProps) {
  const router = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDisplayDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const getTripSummary = () => {
    const parts = [];
    if (numAdults > 0) parts.push(`${numAdults} Adult${numAdults > 1 ? 's' : ''}`);
    if (numChildren > 0) parts.push(`${numChildren} child${numChildren > 1 ? 'ren' : ''}`);
    if (numPets > 0) parts.push(`${numPets} pet${numPets > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const handleViewLease = () => {
    if (leaseDocumentId) {
      window.open(`/api/documents/${leaseDocumentId}/view`, '_blank');
    } else if (matchId) {
      router.push(`/app/rent/match/${matchId}/lease-signing`);
    } else {
      console.log('No lease document available');
    }
  };

  const handleViewListing = () => {
    // Extract listing ID from booking or navigate to search
    console.log('View listing clicked');
  };

  const handleGetDirections = () => {
    // Open Google Maps with the address
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleModifyDates = () => {
    if (bookingId) {
      router.push(`/app/rent/booking/${bookingId}/modify-dates`);
    } else {
      console.log('Modify dates clicked (demo mode)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Image */}
      <div className="relative w-full h-[340px] rounded-lg overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Trip Details */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          {title}
        </h1>
        <p className="text-gray-600">{getTripSummary()}</p>
      </div>

      {/* Date Boxes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#095859]/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">Move-In</div>
          <div className="text-gray-900">{formatDisplayDate(startDate)}</div>
        </div>
        <div className="bg-[#095859]/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">Move-Out</div>
          <div className="text-gray-900">{formatDisplayDate(endDate)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => {
            if (bookingId) {
              router.push(`/app/rent/booking/${bookingId}/move-in/instructions`);
            } else {
              router.push('/newnew/demo/move-in/instructions');
            }
          }}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
        >
          <Package className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Move in Instructions</span>
        </button>

        <button 
          onClick={handleModifyDates}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
        >
          <Calendar className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Modify Dates</span>
        </button>
      </div>

      {/* Address with Copy */}
      <div className="flex items-center py-4">
        <span className="text-gray-900 text-base">{address}</span>
        <button
          onClick={handleCopyAddress}
          className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
        >
          {copiedAddress ? (
            <span className="text-sm font-medium text-teal-600">Copied!</span>
          ) : (
            <Copy className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* More Action Links */}
      <div className="space-y-2">
        <button 
          onClick={handleViewListing}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
        >
          <Home className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">View Listing</span>
        </button>

        <button 
          onClick={handleGetDirections}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
        >
          <MapPin className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Get Directions</span>
        </button>

        <button 
          onClick={handleViewLease}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
        >
          <FileText className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">View Lease</span>
        </button>
      </div>
    </div>
  );
}

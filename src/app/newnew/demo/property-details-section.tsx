'use client';

import { Button } from "@/components/ui/button";
import { Copy, Package, Calendar, Home, MapPin, FileText } from "lucide-react";
import { useState } from "react";

export default function PropertyDetailsSection() {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("3024 N 1400 E North Ogden, UT 84414");
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Image */}
      <div className="relative w-full h-[340px] rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop"
          alt="Luxury Home with Golden Gate Bridge View"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Trip Details */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Your Home Away from Home
        </h1>
        <p className="text-gray-600">2 Adults, 1 child, 1 pet</p>
      </div>

      {/* Date Boxes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#095859]/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">Move-In</div>
          <div className="text-gray-900">12 Jun 2025</div>
        </div>
        <div className="bg-[#095859]/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">Move-Out</div>
          <div className="text-gray-900">12 Jun 2025</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg">
          <Package className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Move in Instructions</span>
        </button>

        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg">
          <Calendar className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Modify Dates</span>
        </button>
      </div>

      {/* Address with Copy */}
      <div className="flex items-center justify-between py-4">
        <span className="text-gray-900 text-base">3024 N 1400 E North Ogden, UT 84414</span>
        <button
          onClick={handleCopyAddress}
          className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
        >
          <Copy className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* More Action Links */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg">
          <Home className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">View Listing</span>
        </button>

        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg">
          <MapPin className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">Get Directions</span>
        </button>

        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg">
          <FileText className="w-6 h-6 text-gray-700" />
          <span className="text-gray-900 text-base">View Lease</span>
        </button>
      </div>
    </div>
  );
}

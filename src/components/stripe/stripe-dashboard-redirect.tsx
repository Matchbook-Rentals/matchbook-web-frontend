"use client";

import React, { useState } from "react";
import { BrandButton } from "@/components/ui/brandButton";
import { ExternalLink, Loader2 } from "lucide-react";

export default function StripeDashboardRedirect() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-login-link', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create login link');
      }

      window.open(data.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Stripe Connect Dashboard
      </h2>

      <p className="text-gray-600 mb-6">
        Access your Stripe Connect dashboard to manage payment settings, view transaction history,
        update banking information, and configure payout schedules.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <BrandButton
        onClick={handleOpenDashboard}
        disabled={isLoading}
        size="lg"
        className="inline-flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening Dashboard...
          </>
        ) : (
          <>
            Open Stripe Dashboard
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </BrandButton>
    </div>
  );
}
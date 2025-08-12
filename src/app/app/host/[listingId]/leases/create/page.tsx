"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { TemplateCreationStep } from "@/features/lease-signing/steps";

export default function CreateLeasePage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;

  const handleTemplateCreated = (template: any) => {
    console.log('Template created:', template);
    // Here you would handle the template creation (save to database, etc.)
    
    // Navigate back to the leases page
    router.push(`/app/host/${listingId}/leases`);
  };

  const handleCancel = () => {
    // Navigate back to the leases page
    router.push(`/app/host/${listingId}/leases`);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-6">
      <TemplateCreationStep
        onTemplateCreated={handleTemplateCreated}
        onCancel={handleCancel}
      />
    </div>
  );
}
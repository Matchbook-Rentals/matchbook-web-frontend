import React from "react";
import AddPropertyClient from "./add-property-client";
import { loadDraftData } from "@/lib/listing-actions-helpers";

export default async function AddPropertyPage({
  searchParams
}: {
  searchParams: { draftId?: string; new?: string }
}) {
  let draftData = null;
  
  // If user wants to continue editing a specific draft, load the draft data server-side
  if (searchParams.draftId) {
    try {
      console.log('🔄 [PAGE] Loading draft data for draftId:', searchParams.draftId);
      draftData = await loadDraftData(searchParams.draftId);
      console.log('📋 [PAGE] Loaded draft data:', draftData);
    } catch (error) {
      console.error('❌ [PAGE] Error loading draft data:', error);
      // Continue without draft data - will show fresh form
    }
    
    return (
      <div>
        <AddPropertyClient draftData={draftData} />
      </div>
    );
  }

  // For all other cases (including when no query params are provided),
  // automatically create a new draft - behave as if new=true was passed
  return (
    <div>
      <AddPropertyClient draftData={null} />
    </div>
  );
}

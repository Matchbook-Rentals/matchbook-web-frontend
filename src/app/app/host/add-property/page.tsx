import React from "react";
import AddPropertyClient from "./add-property-client";

export default async function AddPropertyPage({
  searchParams
}: {
  searchParams: { draftId?: string; new?: string }
}) {
  // If user wants to continue editing a specific draft, show the form with that draft
  if (searchParams.draftId) {
    return (
      <div>
        <AddPropertyClient />
      </div>
    );
  }

  // For all other cases (including when no query params are provided),
  // automatically create a new draft - behave as if new=true was passed
  return (
    <div>
      <AddPropertyClient />
    </div>
  );
}

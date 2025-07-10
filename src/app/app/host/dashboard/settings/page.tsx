import React from "react";

async function fetchSettings() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {};
}

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="flex-1 space-y-4">
        <p className="text-muted-foreground">Settings loaded successfully.</p>
      </div>
    </div>
  );
}
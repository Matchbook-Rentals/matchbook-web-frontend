import React from "react";
import CardWithHeader from "@/components/ui/card-with-header";

export default function PaymentsTab() {
  return (
    <div className="flex py-2 justify-between">
      <div className="flex flex-col  border-red-500 gap-y-4 w-2/3">
        <CardWithHeader
          className="w-full"
          title="Upcoming Payments"
          content={<div>Upcoming payment content goes here.</div>}
        />
        <CardWithHeader
          className="w-full"
          title="Past Payments"
          content={<div>Past payment content goes here.</div>}
        />
      </div>
      <div className="flex flex-col border-6 border-red-500 gap-y-4 w-1/4">
        <CardWithHeader
          className="w-full"
          title="Settings"
          content={<div className="text-center">Payout Settings</div>}
        />
        {/* Content section of CardWithHeader will need to be reworked to directly render content wihtout buffer contatinger in beteween */}
      </div>
    </div>
  );
}

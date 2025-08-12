"use client";

import { DownloadIcon, MoreVerticalIcon } from "lucide-react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LeasesPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  
  const documents = [
    {
      id: 1,
      title: "Lease for 2077 Lakeline Drive",
      status: "Complete",
      statusColor: "bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]",
      lastUpdated: "Last updated 1 week ago",
      buttonText: "Modify",
      buttonVariant: "default" as const,
    },
    {
      id: 2,
      title: "Addendum for 2077 Lakeline Drive",
      status: "Incomplete",
      statusColor: "bg-[#ffeaea] text-[#ff3b30] border-[#ff3b30]",
      lastUpdated: "Last updated 1 week ago",
      buttonText: "Add Signature Blocks",
      buttonVariant: "default" as const,
    },
  ];

  return (
    <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9]">
      <header className="flex items-end gap-6 w-full">
        <div className="flex flex-col items-start gap-2 flex-1">
          <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
            Lease and Addendums
          </h1>
          <p className="font-normal text-[#777b8b] text-base leading-6 [font-family:'Poppins',Helvetica] tracking-[0]">
            Renters will be required to sign these documents at booking
          </p>
        </div>
        <Button 
          className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
          onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
        >
          Add Lease or Addendum
        </Button>
      </header>

      <section className="flex flex-col items-start gap-6 w-full">
        {documents.map((document) => (
          <Card
            key={document.id}
            className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-2 w-full">
                <div className="flex items-start gap-6 flex-1">
                  <div className="flex flex-col items-start gap-2.5 flex-1">
                    <div className="flex flex-col items-start justify-center gap-2 w-full">
                      <div className="inline-flex items-start gap-2">
                        <h2 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                          {document.title}
                        </h2>
                        <Badge
                          className={`${document.statusColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                        >
                          {document.status}
                        </Badge>
                      </div>
                      <p className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                        {document.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={document.buttonVariant}
                    className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
                  >
                    {document.buttonText}
                  </Button>
                </div>
                <div className="inline-flex flex-col items-end justify-center gap-2">
                  <div className="inline-flex flex-col h-px items-start gap-2.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="p-2.5 rounded-lg border-[#3c8787] h-auto"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex flex-col items-end justify-center gap-3 w-full">
                    <Button variant="ghost" size="icon" className="h-auto p-1">
                      <MoreVerticalIcon className="w-5 h-5 text-[#484a54]" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
"use client";

import { DownloadIcon, MoreVerticalIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PdfTemplate } from "@prisma/client";

export default function LeasesPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pdf-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Failed to fetch templates');
      }
    } catch (err) {
      setError('Error loading templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateStatus = (template: PdfTemplate) => {
    const templateData = template.templateData as any;
    const hasFields = templateData?.fields?.length > 0;
    const hasRecipients = templateData?.recipients?.length > 0;
    
    if (hasFields && hasRecipients) {
      return {
        status: "Complete",
        statusColor: "bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]",
        buttonText: "Modify"
      };
    } else {
      return {
        status: "Incomplete",
        statusColor: "bg-[#ffeaea] text-[#ff3b30] border-[#ff3b30]",
        buttonText: "Add Signature Blocks"
      };
    }
  };

  const formatLastUpdated = (updatedAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(updatedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Last updated today";
    } else if (diffDays === 1) {
      return "Last updated yesterday";
    } else if (diffDays < 7) {
      return `Last updated ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Last updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return new Date(updatedAt).toLocaleDateString();
    }
  };

  if (loading) {
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
        <div className="flex items-center justify-center py-8 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
            <p className="text-[#777b8b]">Loading templates...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
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
        <div className="flex items-center justify-center py-8 w-full">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchTemplates}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

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
        {templates.length === 0 ? (
          <div className="w-full text-center py-12">
            <h3 className="text-lg font-semibold text-[#484a54] mb-2">No lease templates found</h3>
            <p className="text-[#777b8b] mb-4">Create your first lease template to get started</p>
            <Button 
              className="bg-[#3c8787] hover:bg-[#2d6666] text-white"
              onClick={() => router.push(`/app/host/${listingId}/leases/create`)}
            >
              Create Template
            </Button>
          </div>
        ) : (
          templates.map((template) => {
            const { status, statusColor, buttonText } = getTemplateStatus(template);
            
            return (
              <Card
                key={template.id}
                className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-2 w-full">
                    <div className="flex items-start gap-6 flex-1">
                      <div className="flex flex-col items-start gap-2.5 flex-1">
                        <div className="flex flex-col items-start justify-center gap-2 w-full">
                          <div className="inline-flex items-start gap-2">
                            <h2 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                              {template.title}
                            </h2>
                            <Badge
                              className={`${statusColor} rounded-full border-solid font-medium text-sm text-center leading-5 whitespace-nowrap [font-family:'Poppins',Helvetica] tracking-[0]`}
                            >
                              {status}
                            </Badge>
                          </div>
                          <p className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
                            {formatLastUpdated(template.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        className="bg-[#3c8787] hover:bg-[#2d6666] text-white h-auto"
                        onClick={() => router.push(`/app/host/${listingId}/leases/create?templateId=${template.id}`)}
                      >
                        {buttonText}
                      </Button>
                    </div>
                    <div className="inline-flex flex-col items-end justify-center gap-2">
                      <div className="inline-flex flex-col h-px items-start gap-2.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="p-2.5 rounded-lg border-[#3c8787] h-auto"
                          onClick={() => {
                            // Download template PDF
                            if (template.pdfFileUrl) {
                              window.open(template.pdfFileUrl, '_blank');
                            }
                          }}
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
            );
          })
        )}
      </section>
    </main>
  );
}
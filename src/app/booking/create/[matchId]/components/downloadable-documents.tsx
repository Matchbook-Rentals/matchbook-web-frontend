'use client';

import { ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { MatchWithRelations } from '@/types';

interface DownloadableDocumentsProps {
  match: MatchWithRelations;
}

/**
 * Adapted from src/app/app/rent/match/[matchId]/complete/complete-client.tsx.
 * Currently surfaces just the signed lease document for viewing; additional
 * docs (payment receipt, move-in checklist) can be wired up as endpoints land.
 */
export function DownloadableDocuments({ match }: DownloadableDocumentsProps) {
  const documents = [
    {
      name: 'Signed Lease Agreement',
      icon: FileText,
      available: !!match.leaseDocumentId,
      viewUrl: match.leaseDocumentId
        ? `/api/documents/${match.leaseDocumentId}/view`
        : null,
    },
  ];

  const handleView = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="flex flex-col items-start justify-center gap-6 self-stretch w-full">
      <h2 className="self-stretch [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-xl tracking-[0.15px] leading-[normal] m-0">
        Downloadable Documents
      </h2>

      {documents.map((document, index) => {
        const IconComponent = document.icon;
        return (
          <Card
            key={index}
            className={`self-stretch w-full bg-[#0a606014] rounded-lg border border-solid border-[#e6e6e6] ${
              document.available ? 'cursor-pointer hover:bg-[#0a606020]' : 'opacity-50'
            }`}
            onClick={() => document.available && handleView(document.viewUrl)}
          >
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <IconComponent className="w-10 h-10 text-[#484a54]" />

              <div className="flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#484a54] text-lg tracking-[0] leading-[normal]">
                {document.name}
                {!document.available && (
                  <span className="text-sm text-gray-400 ml-2">(Coming soon)</span>
                )}
              </div>

              {document.available && <ExternalLink className="w-8 h-8 text-[#484a54]" />}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

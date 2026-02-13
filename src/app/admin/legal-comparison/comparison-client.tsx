"use client";

import { useState } from "react";
import { TermsHtmlContent } from "@/app/terms-of-service/terms-html-content";
import { PrivacyPolicyContent } from "@/app/privacy-policy/privacy-policy-content";
import { FcraHtmlContent } from "@/app/host-fcra-compliance/fcra-html-content";
import { CookieNoticeContent } from "@/app/cookie-notice/cookie-notice-content";
import { CaliforniaPrivacyContent } from "@/app/california-privacy-notice/california-privacy-content";
import { ChevronDown, ChevronRight } from "lucide-react";

interface LegalDocument {
  id: string;
  title: string;
  currentComponent: React.ReactNode;
  liveUrl: string;
}

interface ComparisonClientProps {
  htmlContent: {
    terms: string;
    privacy: string;
    fcra: string;
    cookie: string;
    ccpa: string;
  };
}

export function ComparisonClient({ htmlContent }: ComparisonClientProps) {
  const documents: LegalDocument[] = [
    {
      id: "terms",
      title: "Terms of Service",
      currentComponent: <TermsHtmlContent htmlContent={htmlContent.terms} />,
      liveUrl: "/terms-of-service",
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      currentComponent: <PrivacyPolicyContent />,
      liveUrl: "/privacy-policy",
    },
    {
      id: "fcra",
      title: "Host FCRA Compliance",
      currentComponent: <FcraHtmlContent htmlContent={htmlContent.fcra} />,
      liveUrl: "/host-fcra-compliance",
    },
    {
      id: "cookie",
      title: "Cookie Notice",
      currentComponent: <CookieNoticeContent />,
      liveUrl: "/cookie-notice",
    },
    {
      id: "ccpa",
      title: "California Privacy Notice",
      currentComponent: <CaliforniaPrivacyContent />,
      liveUrl: "/california-privacy-notice",
    },
  ];
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const toggleDocument = (id: string) => {
    setExpandedDocs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedDocs(new Set(documents.map((d) => d.id)));
  };

  const collapseAll = () => {
    setExpandedDocs(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={expandAll}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Collapse All
        </button>
      </div>

      {/* Document Comparisons */}
      {documents.map((doc) => {
        const isExpanded = expandedDocs.has(doc.id);

        return (
          <div
            key={doc.id}
            className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-sm"
          >
            {/* Header */}
            <div className="w-full px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleDocument(doc.id)}
                  className="flex items-center gap-3 hover:text-gray-700 transition"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <h2 className="text-xl font-semibold">{doc.title}</h2>
                </button>
                <a
                  href={doc.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Live Page →
                </a>
              </div>
            </div>

            {/* Comparison Content */}
            {isExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-gray-300">
                {/* Current Version */}
                <div className="border-r border-gray-300">
                  <div className="sticky top-0 bg-blue-50 px-6 py-3 border-b border-gray-300 z-10">
                    <h3 className="font-semibold text-blue-900">
                      Current Version (React)
                    </h3>
                  </div>
                  <div className="p-6 h-[600px] overflow-y-auto prose prose-sm max-w-none">
                    {doc.currentComponent}
                  </div>
                </div>

                {/* New HTML Version */}
                <div>
                  <div className="sticky top-0 bg-green-50 px-6 py-3 border-b border-gray-300 z-10">
                    <h3 className="font-semibold text-green-900">
                      New Version (HTML)
                    </h3>
                  </div>
                  <div
                    className="p-6 h-[600px] overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: htmlContent[doc.id as keyof typeof htmlContent],
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

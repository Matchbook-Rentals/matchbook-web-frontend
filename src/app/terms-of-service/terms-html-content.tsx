"use client";

interface TermsHtmlContentProps {
  htmlContent: string;
}

export function TermsHtmlContent({ htmlContent }: TermsHtmlContentProps) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

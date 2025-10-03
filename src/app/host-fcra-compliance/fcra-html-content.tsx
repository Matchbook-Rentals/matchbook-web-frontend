"use client";

interface FcraHtmlContentProps {
  htmlContent: string;
}

export function FcraHtmlContent({ htmlContent }: FcraHtmlContentProps) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

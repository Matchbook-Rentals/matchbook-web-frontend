"use client";

interface CaliforniaPrivacyHtmlContentProps {
  htmlContent: string;
}

export function CaliforniaPrivacyHtmlContent({ htmlContent }: CaliforniaPrivacyHtmlContentProps) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

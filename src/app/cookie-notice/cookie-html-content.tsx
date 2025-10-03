"use client";

interface CookieHtmlContentProps {
  htmlContent: string;
}

export function CookieHtmlContent({ htmlContent }: CookieHtmlContentProps) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

import { HomeIcon } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Card, CardContent } from "../ui/card";

interface MarketingPageHeaderProps {
  headerText: string;
  highlightedText?: string;
  breadcrumbText?: string;
  articleSlug?: string;
  onSlugChange?: (slug: string) => void;
  asHeader?: boolean;
}

export const MarketingPageHeader = ({
  headerText,
  highlightedText,
  breadcrumbText,
  articleSlug,
  onSlugChange,
  asHeader = true,
}: MarketingPageHeaderProps): JSX.Element => {
  const HeaderTag = asHeader ? 'h1' : 'span';
  const toTitleCase = (str: string) => {
    return str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Card className="w-[1143px] px-8 md:px-[100px] py-8 md:py-10 flex flex-col items-center bg-background justify-center gap-3 rounded-xl border border-[#d1d5da]">
      <CardContent className="p-0 flex flex-col items-center w-full bg-background">
        <div className="flex flex-col items-center">
          {highlightedText && (
            <h2 className="w-fit [font-family:'Lora',Helvetica] font-semibold text-[#0b6969] text-base text-center">
              {highlightedText}
            </h2>
          )}
          <HeaderTag className="w-fit font-[Lora] font-medium text-gray-neutral900 text-center tracking-[-2px] leading-[100%]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            {headerText}
          </HeaderTag>
        </div>

        <Breadcrumb className="mt-3">
          <BreadcrumbList className="flex items-center gap-[15px]">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-small text-gray-3500">
              /
            </BreadcrumbSeparator>
            {articleSlug ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/articles" className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-[14px] md:text-base leading-6 cursor-pointer hover:underline">
                    Articles
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-small text-gray-3500">
                  /
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {onSlugChange ? (
                    <input
                      type="text"
                      value={toTitleCase(articleSlug || '')}
                      onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'))}
                      className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-[14px] md:text-base leading-6 bg-transparent border-none outline-none focus:ring-0 min-w-[60px]"
                      style={{ width: `${Math.max(60, (articleSlug?.length || 5) * 10)}px` }}
                    />
                  ) : (
                    <BreadcrumbPage className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-[14px] md:text-base leading-6">
                      {toTitleCase(articleSlug)}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-[14px] md:text-base leading-6">
                  {breadcrumbText || headerText}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </CardContent>
    </Card>
  );
};

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  text: string;
  bg: string;
  valueColor: string;
  labelColor: string;
}

interface Subtitle {
  value?: string;
  name?: string;
  text?: string;
  valueColor?: string;
}

interface StatisticsCardProps {
  id: string;
  title: string;
  value: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  link?: string;
  badges?: Badge[];
  subtitle?: Subtitle;
  footer?: React.ReactNode;
  asLink?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatisticsCard({
  id,
  title,
  value,
  icon: Icon,
  iconBg = "bg-gray-50",
  iconColor = "text-gray-700",
  link,
  badges = [],
  subtitle,
  footer,
  asLink = true,
  className,
  onClick,
}: StatisticsCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (link) {
      setIsLoading(true);
    }
  };

  const cardContent = (
    <div className="flex flex-col items-start gap-4 p-5 h-full">
      <div className="flex gap-4 self-stretch w-full items-start">
        <div className="flex flex-col gap-2 flex-1 items-start">
          <div className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-900 text-sm sm:text-base leading-5 sm:leading-6">
            {title}
          </div>
        </div>

        <div
          className={cn(
            "flex w-10 h-10 items-center justify-center gap-2 p-2 rounded-full overflow-hidden flex-shrink-0",
            iconBg
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-700 animate-spin flex-shrink-0" />
          ) : (
            <Icon className={cn("w-5 h-5 flex-shrink-0", iconColor)} />
          )}
        </div>
      </div>

      <div className="flex items-start gap-4 self-stretch w-full flex-1">
        <div
          className={cn(
            "flex flex-col items-start gap-4 h-full justify-between",
            badges?.length ? "flex-1" : "min-w-[120px]"
          )}
        >
          <div className="self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-900 text-[28px] leading-[33.6px] min-w-0 overflow-hidden text-ellipsis">
            <span className="block truncate">
              {value}
            </span>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {badges && badges.length > 0 && (
              <div className="hidden sm:flex items-center justify-between w-full gap-3">
                {badges.map((badge, badgeIndex) => {
                  // Only show pending badges at small sizes, show all badges at larger sizes
                  const isPending = badge.text.toLowerCase().includes('pending');
                  
                  return (
                    <div
                      key={badgeIndex}
                      className={cn(
                        "px-2.5 py-1 rounded-full font-normal text-xs flex-1 text-center min-w-0",
                        badge.bg,
                        !isPending && "hidden sm:block"
                      )}
                    >
                      <span className={cn(badge.valueColor, "leading-[0.1px]")}>
                        {badge.text.split(" ")[0]}{" "}
                      </span>
                      <span className={cn(badge.labelColor, "leading-[18px]")}>
                        {badge.text.split(" ")[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Show only pending badges at small sizes */}
            {badges && badges.length > 0 && (
              <div className="flex sm:hidden items-center justify-start w-full gap-2">
                {badges
                  .filter(badge => badge.text.toLowerCase().includes('pending'))
                  .map((badge, badgeIndex) => (
                    <div
                      key={badgeIndex}
                      className={cn(
                        "px-2 py-1 rounded-full font-normal text-xs text-center",
                        badge.bg
                      )}
                    >
                      <span className={cn(badge.valueColor, "leading-[0.1px]")}>
                        {badge.text.split(" ")[0]}{" "}
                      </span>
                      <span className={cn(badge.labelColor, "leading-[18px]")}>
                        {badge.text.split(" ")[1]}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}

            {subtitle && (
              <div className="flex items-center gap-1 self-stretch w-full">
                {subtitle.value && (
                  <div className="inline-flex items-center">
                    <div
                      className={cn(
                        "w-fit mt-[-1.00px] font-semibold text-sm whitespace-nowrap",
                        subtitle.valueColor || "text-blue-600"
                      )}
                    >
                      {subtitle.value}
                    </div>
                  </div>
                )}
                <div className="w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-gray-500 text-sm leading-[21px] whitespace-nowrap">
                  {subtitle.name || subtitle.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {footer && (
        <div className="w-full mt-auto">
          {footer}
        </div>
      )}
    </div>
  );

  const cardClassName = cn(
    "flex-1 border border-solid border-gray-200 rounded-[20px] overflow-hidden bg-white shadow-sm flex flex-col",
    (link && asLink || onClick) && "transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
    className
  );

  if (link && asLink) {
    return (
      <Link href={link} onClick={handleClick} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={handleClick} className={cn(cardClassName, "cursor-pointer")}>
        {cardContent}
      </div>
    );
  }

  return <div className={cardClassName}>{cardContent}</div>;
}
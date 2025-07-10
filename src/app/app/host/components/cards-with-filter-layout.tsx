"use client";

import React, { useEffect, useState, useRef } from "react";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BrandCheckbox } from "@/app/brandCheckbox";
import { useUser } from "@clerk/nextjs";

interface TabLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  searchPlaceholder?: string;
  filterLabel?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  onSearchChange?: (value: string) => void;
  onFilterChange?: (value: string) => void;
  actionButton?: React.ReactNode; // Optional button component
  // Pagination props (optional)
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    itemLabel?: string; // e.g., "listings", "applications", "bookings"
  };
  emptyStateMessage?: string;
  totalCount?: number; // For showing filtered vs total count
  noMargin?: boolean; // Option to disable APP_PAGE_MARGIN for nested layouts
  // Mock data toggle (admin only)
  showMockDataToggle?: boolean;
  useMockData?: boolean;
  onMockDataToggle?: (checked: boolean) => void;
}

export default function TabLayout({
  title,
  subtitle,
  children,
  searchPlaceholder = "Search",
  filterLabel = "Filter by status",
  filterOptions = [{ value: "all", label: "All" }],
  onSearchChange,
  onFilterChange,
  actionButton,
  pagination,
  emptyStateMessage = "No items found.",
  totalCount,
  noMargin = false,
  showMockDataToggle = false,
  useMockData = false,
  onMockDataToggle,
}: TabLayoutProps) {
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const [scrollAreaHeight, setScrollAreaHeight] = useState<string>('calc(100vh - 300px)');
  const headerRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  // Calculate scroll area height dynamically
  useEffect(() => {
    const calculateHeight = () => {
      if (!headerRef.current) return;
      
      const headerHeight = headerRef.current.offsetHeight;
      const paginationHeight = paginationRef.current ? paginationRef.current.offsetHeight : 80; // Default height for pagination
      const topOffset = headerRef.current.offsetTop;
      const bottomPadding = 32; // Some padding at the bottom
      
      const availableHeight = window.innerHeight - topOffset - headerHeight - paginationHeight - bottomPadding;
      setScrollAreaHeight(`${availableHeight}px`);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    // Recalculate when content changes
    const observer = new ResizeObserver(calculateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    if (paginationRef.current) observer.observe(paginationRef.current);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
      observer.disconnect();
    };
  }, [isMobile, pagination]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    
    const pages = [];
    const maxPagesToShow = isMobile ? 3 : 5; // Fewer pages on mobile
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= (isMobile ? 2 : 4); i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - (isMobile ? 1 : 3); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        if (!isMobile) {
          pages.push('ellipsis');
          pages.push(currentPage - 1);
        }
        pages.push(currentPage);
        if (!isMobile) {
          pages.push(currentPage + 1);
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const hasContent = React.Children.count(children) > 0;

  // Unified layout for both mobile and desktop
  return (
    <div className={`${isMobile ? '' : noMargin ? '' : APP_PAGE_MARGIN} flex flex-col `}>
      {/* Header with title, search, and filters */}
      <header ref={headerRef} className={`w-full py-6 ${isMobile ? 'px-4' : ''}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-end gap-6">
            <div className="flex flex-col items-start gap-2 flex-1">
              <h1 className="font-medium text-[#3f3f3f] text-2xl leading-[28.8px] font-['Poppins',Helvetica]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[#6b7280] text-base leading-6 font-['Poppins',Helvetica]">
                  {subtitle}
                </p>
              )}
            </div>
            {actionButton && !isMobile && (
              <div>
                {actionButton}
              </div>
            )}
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-start gap-3'}`}>
            <div className={isMobile ? 'w-full' : 'w-[434px]'}>
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <Input 
                    className="h-12" 
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-end gap-6'} flex-1`}>
              {/* Mock Data Toggle for Admins */}
              {showMockDataToggle && isAdmin && (
                <div className="flex items-center">
                  <BrandCheckbox
                    checked={useMockData}
                    onChange={(e) => onMockDataToggle?.(e.target.checked)}
                    label="Use mock data"
                    name="mock-data-toggle"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-[#6b7280] text-base leading-6 font-['Poppins',Helvetica]">
                  {filterLabel}
                </span>
                <Select onValueChange={onFilterChange}>
                  <SelectTrigger className="w-[142px] h-12">
                    <SelectValue placeholder={filterOptions?.[0]?.label || "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {actionButton && isMobile && (
              <div>
                {actionButton}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content Area with Scroll */}
      <div className={`flex-1 min-h-0 ${isMobile ? 'px-4 py-4' : 'mt-1'}`}>
        {!hasContent ? (
          <div className="text-center py-12 text-gray-500">
            {emptyStateMessage}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Scrollable content area - only use ScrollArea on desktop */}
            {isMobile ? (
              <>
                <div className="space-y-4">
                  {children}
                </div>
                
                {/* Mobile Pagination */}
                {pagination && pagination.totalItems > pagination.itemsPerPage && (
                  <div className="mt-8 space-y-4">
                    <div className="text-sm text-gray-600 text-center">
                      Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex, pagination.totalItems)} of {pagination.totalItems} {pagination.itemLabel || 'items'}
                      {totalCount && totalCount > pagination.totalItems && ` (${totalCount} total)`}
                    </div>
                    
                    <Pagination>
                      <PaginationContent className="flex-wrap justify-center gap-1">
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pagination.currentPage > 1) {
                                pagination.onPageChange(pagination.currentPage - 1);
                              }
                            }}
                            className={`${pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} text-sm px-2 py-1`}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((pageNum, index) => (
                          <PaginationItem key={index}>
                            {pageNum === 'ellipsis' ? (
                              <PaginationEllipsis className="text-sm" />
                            ) : (
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  pagination.onPageChange(pageNum as number);
                                }}
                                isActive={pagination.currentPage === pageNum}
                                className="cursor-pointer text-sm px-2 py-1 min-w-[32px]"
                              >
                                {pageNum}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pagination.currentPage < pagination.totalPages) {
                                pagination.onPageChange(pagination.currentPage + 1);
                              }
                            }}
                            className={`${pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} text-sm px-2 py-1`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <>
                <ScrollArea style={{ height: scrollAreaHeight }} className="w-[100.5%] pr-2">
                  <div className="space-y-4">
                    {children}
                  </div>
                </ScrollArea>
                
                {/* Desktop Pagination - Fixed at bottom */}
                {pagination && pagination.totalItems > pagination.itemsPerPage && (
                  <div ref={paginationRef} className="mt-4 pt-4 border-t border-gray-200 bg-background">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Showing {pagination.startIndex + 1}-{Math.min(pagination.endIndex, pagination.totalItems)} of {pagination.totalItems} {pagination.itemLabel || 'items'}
                        {totalCount && totalCount > pagination.totalItems && ` (${totalCount} total)`}
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (pagination.currentPage > 1) {
                                  pagination.onPageChange(pagination.currentPage - 1);
                                }
                              }}
                              className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {getPageNumbers().map((pageNum, index) => (
                            <PaginationItem key={index}>
                              {pageNum === 'ellipsis' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    pagination.onPageChange(pageNum as number);
                                  }}
                                  isActive={pagination.currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (pagination.currentPage < pagination.totalPages) {
                                  pagination.onPageChange(pagination.currentPage + 1);
                                }
                              }}
                              className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

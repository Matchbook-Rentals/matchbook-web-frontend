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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TabLayoutProps {
  title: string;
  sidebarContent: React.ReactNode;
  children: React.ReactNode;
  searchBar: React.ReactNode; // New prop for search bar
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
}

export default function TabLayout({
  title,
  sidebarContent,
  children,
  searchBar,
  actionButton,
  pagination,
  emptyStateMessage = "No items found.",
  totalCount,
  noMargin = false,
}: TabLayoutProps) {
  const isMobile = useIsMobile();
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
      <div ref={headerRef} className={`bg-background ${isMobile ? 'sticky top-0 z-40 border-b border-gray-200 px-4 py-4' : ''}`}>
        
        {/* Title and Action Button Row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className={`font-medium text-[#3f3f3f] [font-family:'Poppins',Helvetica] ${isMobile ? 'text-[24px]' : 'text-[32px]'}`}>
            {title}
          </h1>
          
          {/* Action button positioned on the right - mobile only */}
          {actionButton && isMobile && (
            <div>
              {actionButton}
            </div>
          )}
        </div>
        
        {/* Combined search and filters section */}
        <div className={`${!isMobile ? 'pb-4 border-b border-gray-200' : ''}`}>
          {/* Mobile layout with accordion */}
          {isMobile ? (
            <div className="block md:hidden">
              {/* Search bar for mobile */}
              <div className="mb-4">
                {searchBar}
              </div>
              
              {/* Filters accordion for mobile */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="filters" className="border-0">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Filters</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {sidebarContent}
                      {actionButton && (
                        <div className="pt-4">
                          {actionButton}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            /* Desktop layout with search and filters in wrapping row */
            <div className="hidden md:block relative">
              <div className="flex flex-wrap items-center gap-4 mb-1">
                {/* Search bar */}
                <div className="flex-shrink-0">
                  {searchBar}
                </div>
                
                {/* Filters - allow wrapping */}
                <div className="flex-1 min-w-0">
                  {sidebarContent}
                </div>
              </div>
              
              {/* Action button positioned on far right - desktop only */}
              {actionButton && (
                <div className="absolute top-0 right-0">
                  {actionButton}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

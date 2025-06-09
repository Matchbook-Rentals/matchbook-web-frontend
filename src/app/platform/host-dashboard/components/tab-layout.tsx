"use client";

import React from "react";
import { PAGE_MARGIN } from "@/constants/styles";
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
import { useIsMobile } from "@/hooks/useIsMobile";

interface TabLayoutProps {
  title: string;
  sidebarContent: React.ReactNode;
  children: React.ReactNode;
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
}

export default function TabLayout({
  title,
  sidebarContent,
  children,
  pagination,
  emptyStateMessage = "No items found.",
  totalCount,
}: TabLayoutProps) {
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen pb-20"> {/* pb-20 for mobile tab navigation */}
        {/* Mobile Header with filters */}
        <div className="sticky top-0 bg-white z-40 border-b border-gray-200">
          <div className="px-4 py-4">
            <h1 className="font-medium text-[#3f3f3f] text-[24px] [font-family:'Poppins',Helvetica] mb-4">
              {title}
            </h1>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="filters" className="border-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">Filters</span>
                </AccordionTrigger>
                <AccordionContent>
                  {sidebarContent}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 px-4 py-4">
          {!hasContent ? (
            <div className="text-center py-12 text-gray-500">
              {emptyStateMessage}
            </div>
          ) : (
            <>
              {children}
              
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
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout (original)
  return (
    <div className={`${PAGE_MARGIN} flex`}>
      {/* Sidebar */}
      <div className="w-[201px] mr-8">
        <h1 className="font-medium text-[#3f3f3f] text-[32px] [font-family:'Poppins',Helvetica]">
          {title}
        </h1>
        <div className="mt-2">
          {sidebarContent}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {!hasContent ? (
          <div className="text-center py-12 text-gray-500">
            {emptyStateMessage}
          </div>
        ) : (
          <>
            {children}
            
            {/* Desktop Pagination */}
            {pagination && pagination.totalItems > pagination.itemsPerPage && (
              <div className="mt-8 flex justify-between items-center">
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
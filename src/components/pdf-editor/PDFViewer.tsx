'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Import the PDF worker configuration and styles
import '@/lib/pdfWorker';
import './pdf-editor.css';

// Page selector constant used throughout the app
export const PDF_VIEWER_PAGE_SELECTOR = '[data-pdf-viewer-page]';

export type OnPDFViewerPageClick = (_event: {
  pageNumber: number;
  numPages: number;
  originalEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
  pageHeight: number;
  pageWidth: number;
  pageX: number;
  pageY: number;
}) => void | Promise<void>;

interface PDFViewerProps {
  file: string | File | ArrayBuffer;
  onPageClick?: OnPDFViewerPageClick;
  children?: React.ReactNode;
  pageWidth?: number;
  isFieldPlacementMode?: boolean;
}

export interface PageClickEvent {
  pageNumber: number;
  pageX: number;
  pageY: number;
  pageWidth: number;
  pageHeight: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  onPageClick, 
  children, 
  pageWidth = 800,
  isFieldPlacementMode = false
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    // You could set an error state here if needed
  };

  const onDocumentPageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>, pageNumber: number) => {
      const $page = event.target as Element;
      const pageElement = $page?.closest(PDF_VIEWER_PAGE_SELECTOR) as HTMLElement;
      if (!pageElement) return;

      const { height, width, top, left } = pageElement.getBoundingClientRect();
      const pageX = event.clientX - left;
      const pageY = event.clientY - top;

      onPageClick?.({
        pageNumber,
        numPages,
        originalEvent: event,
        pageHeight: height,
        pageWidth: width,
        pageX,
        pageY,
      });
    },
    [onPageClick, numPages],
  );

  // Keep drag drop for backward compatibility but use new click handler
  const handlePageDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, pageNumber: number) => {
      event.preventDefault();
      // Convert drag event to click event for consistency
      const syntheticClickEvent = {
        ...event,
        clientX: event.clientX,
        clientY: event.clientY,
        target: event.currentTarget,
      } as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>;
      
      onDocumentPageClick(syntheticClickEvent, pageNumber);
    },
    [onDocumentPageClick],
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div ref={containerRef} className="pdf-viewer-container">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="pdf-document"
        loading={
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-96 text-red-600">
            <div className="text-center">
              <p className="text-lg font-semibold">Failed to load PDF</p>
              <p className="text-sm">Please try uploading a different file or refresh the page</p>
            </div>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, index) => (
          <div key={index} className="pdf-page-wrapper mb-6">
            <div 
              className="relative border border-gray-200 overflow-visible rounded shadow-sm"
              data-pdf-viewer-page
              data-page-number={index + 1}
              style={{ position: 'relative' }}
            >
              <Page
                pageNumber={index + 1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page relative z-0"
                onDrop={(e) => handlePageDrop(e, index + 1)}
                onDragOver={handleDragOver}
                loading={
                  <div className="flex items-center justify-center h-48 bg-gray-100">
                    <div className="animate-pulse text-gray-500">Loading page {index + 1}...</div>
                  </div>
                }
              />
              {/* Click overlay - always present to handle clicks/taps for field placement and deselection */}
              <div
                className={cn(
                  "absolute inset-0 z-10",
                  isFieldPlacementMode ? "cursor-crosshair" : "cursor-default"
                )}
                onMouseDown={(e) => {
                  // Skip if clicking on a field - let field handle it
                  const target = e.target as Element;
                  if (target.closest('[data-field-id]')) return;
                  onDocumentPageClick(e, index + 1);
                }}
                onTouchEnd={(e) => {
                  // Skip if tapping on a field - let field handle it
                  const target = e.target as Element;
                  if (target.closest('[data-field-id]')) return;

                  // Handle touch for mobile - convert touch to mouse event format
                  const touch = e.changedTouches[0];
                  if (touch) {
                    const pageElement = (e.target as Element)?.closest(PDF_VIEWER_PAGE_SELECTOR) as HTMLElement;
                    const syntheticEvent = {
                      clientX: touch.clientX,
                      clientY: touch.clientY,
                      target: pageElement || e.target,
                    } as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>;
                    onDocumentPageClick(syntheticEvent, index + 1);
                  }
                }}
                style={{ pointerEvents: 'auto' }}
              />
              {/* Render fields for this page */}
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.props.field?.pageNumber === index + 1) {
                  return child;
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
};
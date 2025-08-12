"use client";

import React, { useState } from "react";
import { FileText, Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  documentUrl?: string;
  documentName?: string;
  height?: string | number;
  className?: string;
  showControls?: boolean;
  onDownload?: () => void;
}

export function DocumentPreview({ 
  documentUrl, 
  documentName = "Document",
  height = 600,
  className,
  showControls = true,
  onDownload
}: DocumentPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!documentUrl) {
    return (
      <Card className={cn("flex items-center justify-center", className)} style={{ height }}>
        <CardContent className="text-center space-y-4 p-8">
          <FileText className="w-16 h-16 mx-auto text-gray-300" />
          <div>
            <p className="text-lg font-medium text-gray-900">No Document Available</p>
            <p className="text-sm text-gray-500 mt-1">
              A document preview will appear here once available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "relative",
      isFullscreen && "fixed inset-0 z-50 bg-white",
      className
    )}>
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            {zoomLevel}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          
          {onDownload && (
            <>
              <div className="w-px h-6 bg-gray-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}

      <div 
        className="w-full overflow-auto bg-gray-100"
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        <div 
          className="min-h-full flex items-center justify-center p-4"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* This would be replaced with actual PDF viewer component */}
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl w-full">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{documentName}</h2>
                <p className="text-gray-500 mt-1">Document Preview</p>
              </div>
              
              <div className="space-y-6">
                {/* Placeholder content */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Signature Field</p>
                  <div className="h-16 border-b-2 border-gray-400 mt-2"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2 } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureComplete: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureComplete,
  width = 400,
  height = 200,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Configure drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // Draw all strokes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      
      ctx.stroke();
    });
  }, [strokes, width, height]);

  // Get point from mouse or touch event
  const getEventPoint = (event: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  };

  // Start drawing
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const point = getEventPoint(event);
    
    setIsDrawing(true);
    setLastPoint(point);
    setCurrentStroke([point]);
  };

  // Continue drawing
  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;
    
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getEventPoint(event);
    
    // Draw line from last point to current point
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    // Update current stroke
    setCurrentStroke(prev => [...prev, currentPoint]);
    setLastPoint(currentPoint);
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setLastPoint(null);
    
    // Save the completed stroke
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
      
      // Generate signature data
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onSignatureComplete(dataUrl);
        }
      }, 100);
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    onSignatureComplete('');
  };

  // Undo last stroke
  const undoLastStroke = () => {
    if (strokes.length === 0) return;
    
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    
    // Redraw without the last stroke
    setTimeout(() => {
      redrawCanvas();
      
      // Update signature data
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = newStrokes.length > 0 ? canvas.toDataURL('image/png') : '';
        onSignatureComplete(dataUrl);
      }
    }, 10);
  };

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="border rounded-lg p-4 bg-transparent">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded cursor-crosshair touch-none"
          style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undoLastStroke}
          disabled={strokes.length === 0}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Undo
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={strokes.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};
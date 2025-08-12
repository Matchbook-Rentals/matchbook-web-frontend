"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function StepWrapper({ 
  title, 
  description, 
  children, 
  className,
  noPadding = false 
}: StepWrapperProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {noPadding ? (
        children
      ) : (
        <CardContent>{children}</CardContent>
      )}
    </Card>
  );
}
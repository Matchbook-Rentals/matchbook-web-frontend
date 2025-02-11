'use client';

import { Button } from "@/components/ui/button";
import { CarouselApi } from "@/components/ui/carousel";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
}

interface DesktopApplicationEditProps {
  navigationItems: NavigationItem[];
  currentStep: number;
  scrollToIndex: (index: number) => void;
  api: CarouselApi | null;
  validateStep: (step: number) => boolean;
}

export function DesktopApplicationEdit({
  navigationItems,
  currentStep,
  scrollToIndex,
  api,
  validateStep,
}: DesktopApplicationEditProps) {
  const { toast } = useToast();

  return (
    <div className="flex gap-6 max-w-full overflow-x-hidden">
      {/* Sidebar Navigation - Hidden on mobile */}
      <div className="hidden md:block pt-1 w-64 shrink-0">
        <nav className="space-y-1">
          {navigationItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-lg transition-colors duration-200",
                currentStep === index
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (!validateStep(currentStep)) {
              toast({
                title: "Validation Error",
                description: "Please correct errors before navigating.",
                variant: "destructive",
              });
              return;
            }
            api?.scrollPrev();
          }}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (!validateStep(currentStep)) {
              toast({
                title: "Validation Error",
                description: "Please correct errors before navigating.",
                variant: "destructive",
              });
              return;
            }
            api?.scrollNext();
          }}
          disabled={currentStep === navigationItems.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
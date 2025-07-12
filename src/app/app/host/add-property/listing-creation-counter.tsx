import React from "react";
import { Button } from "@/components/ui/button";
import { BiPlus, BiMinus } from "react-icons/bi";
import { PlusIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingCreationCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  containerClassName?: string;
  buttonClassName?: string;
  textClassName?: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
  incrementDisabled?: boolean;
  decrementDisabled?: boolean;
  variant?: "default" | "outline";
  iconSize?: "sm" | "md" | "lg";
  monthSuffixClassName?: string;
  textSize?: "sm" | "base" | "lg" | "xl";
  buttonSize?: "sm" | "md" | "lg";
}

export const ListingCreationCounter: React.FC<ListingCreationCounterProps> = ({
  value,
  onChange,
  min = 0,
  max,
  containerClassName,
  buttonClassName,
  textClassName,
  onIncrement,
  onDecrement,
  incrementDisabled,
  decrementDisabled,
  variant = "default",
  iconSize = "lg",
  monthSuffixClassName = "inline",
  textSize = "base",
  buttonSize = "md",
}) => {
  const handleIncrement = () => {
    if (onIncrement) {
      onIncrement();
    } else {
      if (max === undefined || value < max) {
        onChange(value + 1);
      }
    }
  };

  const handleDecrement = () => {
    if (onDecrement) {
      onDecrement();
    } else {
      if (value > min) {
        onChange(value - 1);
      }
    }
  };

  const isIncrementDisabled = incrementDisabled ?? (max !== undefined && value >= max);
  const isDecrementDisabled = decrementDisabled ?? (value <= min);

  const getIconSize = () => {
    switch (iconSize) {
      case "sm": return "h-3 w-3";
      case "md": return "h-4 w-4";
      case "lg": return "h-6 w-6";
      default: return "h-4 w-4";
    }
  };

  const getButtonSize = () => {
    switch (buttonSize) {
      case "sm": return "h-6 w-6";
      case "md": return "h-8 w-8";
      case "lg": return "h-10 w-10";
      default: return "h-8 w-8";
    }
  };

  const getTextSize = () => {
    switch (textSize) {
      case "sm": return "text-sm";
      case "base": return "text-base";
      case "lg": return "text-lg";
      case "xl": return "text-xl";
      default: return "text-base";
    }
  };

  const getDefaultButtonStyle = () => {
    const sizeClass = getButtonSize();
    if (variant === "outline") {
      return `rounded-full ${sizeClass} border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900`;
    }
    return `p-1 ${sizeClass} rounded-full border border-black`;
  };

  const getDefaultTextStyle = () => {
    const sizeClass = getTextSize();
    if (variant === "outline") {
      return `font-normal ${sizeClass} text-[#222222] [font-family:'Poppins',Helvetica]`;
    }
    return `font-text-label-large-medium text-[#5d606d] ${sizeClass}`;
  };

  const getDefaultContainerStyle = () => {
    if (variant === "outline") {
      return buttonSize === "sm" ? "flex items-center space-x-1" : "flex items-center space-x-2";
    }
    return "flex items-center gap-8";
  };

  const IconComponent = variant === "outline" ? MinusIcon : BiMinus;
  const PlusIconComponent = variant === "outline" ? PlusIcon : BiPlus;

  return (
    <div className={cn(getDefaultContainerStyle(), containerClassName)}>
      <Button
        variant={variant === "outline" ? "outline" : "ghost"}
        size="icon"
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        className={cn(getDefaultButtonStyle(), buttonClassName)}
      >
        <IconComponent className={cn(getIconSize(), variant === "default" ? "text-black" : "")} />
      </Button>

      <span className={cn(getDefaultTextStyle(), "text-center min-w-[40px]", textClassName)}>
        <span className="relative inline-block">
          <span className="invisible absolute">{max || 99}<span className={cn("", monthSuffixClassName)}> months</span></span>
          <span className="relative">
            {value}<span className={cn("", monthSuffixClassName)}> month<span className={value !== 1 ? "" : "opacity-0"}>s</span></span>
          </span>
        </span>
      </span>

      <Button
        variant={variant === "outline" ? "outline" : "ghost"}
        size="icon"
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        className={cn(getDefaultButtonStyle(), buttonClassName)}
      >
        <PlusIconComponent className={cn(getIconSize(), variant === "default" ? "text-black" : "")} />
      </Button>
    </div>
  );
};

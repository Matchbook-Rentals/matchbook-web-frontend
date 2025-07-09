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
  showMonthSuffix?: boolean;
  alwaysShowMonthSuffix?: boolean;
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
  showMonthSuffix = false,
  alwaysShowMonthSuffix = false,
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

  const getDefaultButtonStyle = () => {
    if (variant === "outline") {
      return iconSize === "sm" 
        ? "rounded-full h-7 w-7 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900"
        : "rounded-full h-9 w-9 border-2 border-gray-600 text-gray-800 hover:border-gray-800 hover:text-gray-900";
    }
    return "p-1 h-8 w-8 rounded-full border border-black";
  };

  const getDefaultTextStyle = () => {
    if (variant === "outline") {
      return iconSize === "sm" 
        ? "font-normal text-base text-[#222222] [font-family:'Poppins',Helvetica]"
        : "font-normal text-xl text-[#222222] [font-family:'Poppins',Helvetica]";
    }
    return "font-text-label-large-medium text-[#5d606d] text-[18px]";
  };

  const getDefaultContainerStyle = () => {
    if (variant === "outline") {
      return iconSize === "sm" ? "flex items-center space-x-1" : "flex items-center space-x-2";
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

      <span className={cn(getDefaultTextStyle(), "text-center", showMonthSuffix ? "min-w-[120px]" : "min-w-[40px]", textClassName)}>
        {showMonthSuffix ? (
          <>
            {alwaysShowMonthSuffix ? (
              <span>{value} month{value !== 1 ? "s" : ""}</span>
            ) : (
              <>
                <span className="sm:hidden">{value}</span>
                <span className="hidden sm:inline">{value} month{value !== 1 ? "s" : ""}</span>
              </>
            )}
          </>
        ) : (
          value
        )}
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
import React from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ListingCreationCounter } from "./listing-creation-counter";
import { styles } from "./styles";

export interface MonthlyPricing {
  months: number;
  price: string;
  utilitiesIncluded: boolean;
}

interface ListingCreationPricingProps {
  shortestStay: number;
  longestStay: number;
  includeUtilities: boolean;
  utilitiesUpToMonths: number;
  varyPricingByLength: boolean;
  basePrice: string;
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onIncludeUtilitiesChange: (value: boolean) => void;
  onUtilitiesUpToMonthsChange: (value: number) => void;
  onVaryPricingByLengthChange: (value: boolean) => void;
  onBasePriceChange: (value: string) => void;
  onContinue?: () => void;
  isLoading?: boolean;
  questionTextStyles?: string;
  questionSubTextStyles?: string;
  counterTextStyles?: string;
}

const ListingCreationPricing: React.FC<ListingCreationPricingProps> = ({ 
  shortestStay,
  longestStay,
  includeUtilities,
  utilitiesUpToMonths,
  varyPricingByLength,
  basePrice,
  onShortestStayChange,
  onLongestStayChange,
  onIncludeUtilitiesChange,
  onUtilitiesUpToMonthsChange,
  onVaryPricingByLengthChange,
  onBasePriceChange,
  onContinue,
  isLoading,
  questionTextStyles,
  questionSubTextStyles,
  counterTextStyles
}) => {


  // Handlers for increasing/decreasing stay lengths
  const increaseShortestStay = () => {
    if (shortestStay < longestStay) {
      onShortestStayChange(shortestStay + 1);
      // Adjust utilities counter if needed
      if (utilitiesUpToMonths < shortestStay + 1) {
        onUtilitiesUpToMonthsChange(shortestStay + 1);
      }
    }
  };

  const decreaseShortestStay = () => {
    if (shortestStay > 1) {
      onShortestStayChange(shortestStay - 1);
    }
  };

  const increaseLongestStay = () => {
    if (longestStay < 12) {
      onLongestStayChange(longestStay + 1);
    }
  };

  const decreaseLongestStay = () => {
    if (longestStay > shortestStay) {
      onLongestStayChange(longestStay - 1);
      // Adjust utilities counter if needed
      if (utilitiesUpToMonths > longestStay - 1) {
        onUtilitiesUpToMonthsChange(longestStay - 1);
      }
    }
  };

  // Handlers for utilities counter
  const increaseUtilitiesMonths = () => {
    if (utilitiesUpToMonths < longestStay) {
      onUtilitiesUpToMonthsChange(utilitiesUpToMonths + 1);
    }
  };

  const decreaseUtilitiesMonths = () => {
    if (utilitiesUpToMonths > shortestStay) {
      onUtilitiesUpToMonthsChange(utilitiesUpToMonths - 1);
    }
  };

  return (
    <div className="relative w-full max-w-[886px]">
      <div className="w-full">
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className={questionTextStyles || styles.questionText}>
              What&apos;s the shortest stay you will accommodate?
            </h2>
            <ListingCreationCounter
              value={shortestStay}
              onChange={onShortestStayChange}
              onIncrement={increaseShortestStay}
              onDecrement={decreaseShortestStay}
              incrementDisabled={shortestStay >= longestStay}
              decrementDisabled={shortestStay <= 1}
              variant="outline"
              iconSize="md"
              containerClassName="flex items-center space-x-4"
              buttonClassName={styles.counterButton}
              textClassName={counterTextStyles || styles.counterText}
              showMonthSuffix={true}
            />
          </div>
          
          <div className="flex items-center justify-between mt-8">
            <h2 className={questionTextStyles || styles.questionText}>
              What&apos;s the longest stay you will accommodate?
            </h2>
            <ListingCreationCounter
              value={longestStay}
              onChange={onLongestStayChange}
              onIncrement={increaseLongestStay}
              onDecrement={decreaseLongestStay}
              incrementDisabled={longestStay >= 12}
              decrementDisabled={longestStay <= shortestStay}
              variant="outline"
              iconSize="md"
              containerClassName="flex items-center space-x-4"
              buttonClassName={styles.counterButton}
              textClassName={counterTextStyles || styles.counterText}
              showMonthSuffix={true}
            />
          </div>
        </div>

        {/* Pricing Variation Question */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-between">
            <h2 className={questionTextStyles || styles.questionText}>
              Do you want to change pricing based on lease length?
            </h2>
            <Switch 
              id="vary-pricing" 
              checked={varyPricingByLength}
              onCheckedChange={onVaryPricingByLengthChange}
              className="data-[state=checked]:bg-secondaryBrand"
            />
          </div>
          
          {!varyPricingByLength && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className={questionSubTextStyles || styles.labelText}>
                  Monthly rent price for all lease lengths:
                </span>
                <div className="relative w-[234px]">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                  <Input 
                    className="w-full h-10 rounded-[5px] border-2 border-[#0000004c] pl-7 text-lg" 
                    value={basePrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      onBasePriceChange(value);
                    }}
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          )}
          
          {varyPricingByLength && (
            <div className="mt-6">
              <p className={questionSubTextStyles || styles.mutedText}>
                Per length pricing will be set in the next step
              </p>
            </div>
          )}
        </div>

        {/* Utilities Question */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-between">
            <h2 className={questionTextStyles || styles.questionText}>
              Would you like to include utilities on some lease durations?
            </h2>
            <Switch 
              id="include-utilities" 
              checked={includeUtilities}
              onCheckedChange={onIncludeUtilitiesChange}
              className="data-[state=checked]:bg-secondaryBrand"
            />
          </div>
          
          {includeUtilities && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className={questionTextStyles || styles.labelText}>
                  Include utilities for leases up to:
                </span>
                <ListingCreationCounter
                  value={utilitiesUpToMonths}
                  onChange={onUtilitiesUpToMonthsChange}
                  onIncrement={increaseUtilitiesMonths}
                  onDecrement={decreaseUtilitiesMonths}
                  incrementDisabled={utilitiesUpToMonths >= longestStay}
                  decrementDisabled={utilitiesUpToMonths <= shortestStay}
                  variant="outline"
                  iconSize="md"
                  containerClassName="flex items-center space-x-4"
                  buttonClassName={styles.counterButton}
                  textClassName={counterTextStyles || styles.counterText}
                  showMonthSuffix={true}
                />
              </div>
              <p className={`${questionSubTextStyles || styles.mutedText} mt-2`}>
                Utilities will be included for leases from {shortestStay} to {utilitiesUpToMonths} months
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ListingCreationPricing;

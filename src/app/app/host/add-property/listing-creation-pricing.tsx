import React from "react";
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
    }
  };


  return (
    <div className="relative w-full md:max-w-[886px]">
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
              monthSuffixClassName="hidden sm:inline"
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
              monthSuffixClassName="hidden sm:inline"
            />
          </div>
        </div>


      </div>
    </div>
  );
};

export default ListingCreationPricing;

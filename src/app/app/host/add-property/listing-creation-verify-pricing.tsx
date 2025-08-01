import React from "react";
import { Input } from "@/components/ui/input";
import { BrandCheckbox } from "@/app/brandCheckbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingCreationCounter } from "./listing-creation-counter";
import { MonthlyPricing } from "./listing-creation-pricing";
import { styles } from "./styles";
import { createNumberChangeHandler, formatNumberWithCommas, removeCommasFromNumber } from "@/lib/number-validation";

interface ListingCreationVerifyPricingProps {
  shortestStay: number;
  longestStay: number;
  monthlyPricing: MonthlyPricing[];
  includeUtilities: boolean;
  utilitiesUpToMonths: number;
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onMonthlyPricingChange: (pricing: MonthlyPricing[]) => void;
}

const ListingCreationVerifyPricing: React.FC<ListingCreationVerifyPricingProps> = ({
  shortestStay,
  longestStay,
  monthlyPricing,
  includeUtilities,
  utilitiesUpToMonths,
  onShortestStayChange,
  onLongestStayChange,
  onMonthlyPricingChange
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


  // Update a specific month's pricing
  const updateMonthPricing = (months: number, displayPrice: string) => {
    // Store the raw number without commas in state
    const rawPrice = removeCommasFromNumber(displayPrice);
    const updated = monthlyPricing.map(p => 
      p.months === months ? { ...p, price: rawPrice } : p
    );
    onMonthlyPricingChange(updated);
  };

  // Update a specific month's utilities included status
  const updateMonthUtilities = (months: number, utilitiesIncluded: boolean) => {
    // Check if all checkboxes are currently unchecked (false)
    const allUnchecked = monthlyPricing.every(p => !p.utilitiesIncluded);
    
    if (allUnchecked && utilitiesIncluded) {
      // First click when all are unchecked - check all months up to and including the clicked month
      const updated = monthlyPricing.map(p => ({
        ...p,
        utilitiesIncluded: p.months <= months
      }));
      onMonthlyPricingChange(updated);
    } else {
      // Normal behavior - just toggle the clicked checkbox
      const updated = monthlyPricing.map(p => 
        p.months === months ? { ...p, utilitiesIncluded } : p
      );
      onMonthlyPricingChange(updated);
    }
  };

  return (
    <div className="relative w-full md:max-w-[886px]">
      <div className="w-full">

        {/* Interactive Controls - Allow editing stay lengths */}
        <div className="flex items-center justify-between w-full gap-2 xs:justify-center xs:gap-6 sm:gap-8 mb-6 flex-wrap">
          {/* Shortest Stay Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <label className={`${styles.labelTextSmall} whitespace-nowrap`}>
              Shortest stay:
            </label>
            <ListingCreationCounter
              value={shortestStay}
              onChange={onShortestStayChange}
              onIncrement={increaseShortestStay}
              onDecrement={decreaseShortestStay}
              incrementDisabled={shortestStay >= longestStay}
              decrementDisabled={shortestStay <= 1}
              variant="outline"
              iconSize="sm"
              buttonSize="sm"
              textSize="base"
              containerClassName="flex items-center space-x-1"
              buttonClassName={styles.counterButtonSmall}
              textClassName={`${styles.counterTextSmall} min-w-[20px]`}
              monthSuffixClassName="inline xs:hidden sm:inline"
              tabIndex={1}
            />
          </div>

          {/* Longest Stay Controls */}
          <div className="flex items-center gap-3">
            <label className={`${styles.labelTextSmall} whitespace-nowrap`}>
              Longest stay:
            </label>
            <ListingCreationCounter
              value={longestStay}
              onChange={onLongestStayChange}
              onIncrement={increaseLongestStay}
              onDecrement={decreaseLongestStay}
              incrementDisabled={longestStay >= 12}
              decrementDisabled={longestStay <= shortestStay}
              variant="outline"
              iconSize="sm"
              buttonSize="sm"
              textSize="base"
              containerClassName="flex items-center space-x-1"
              buttonClassName={styles.counterButtonSmall}
              textClassName={`${styles.counterTextSmall} min-w-[20px]`}
              monthSuffixClassName="inline xs:hidden sm:inline"
              tabIndex={2}
            />
          </div>
        </div>

        {/* Pricing Table */}
        <div className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6">
                  Lease Length
                </TableHead>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6">
                  Monthly Rent
                </TableHead>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6">
                  Utilities Included
                </TableHead>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6 hidden md:table-cell">
                  Lease Length
                </TableHead>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6 hidden md:table-cell">
                  Monthly Rent
                </TableHead>
                <TableHead className="bg-[#e7f0f0] font-medium text-xs text-[#475467] w-1/3 md:w-1/6 hidden md:table-cell">
                  Utilities Included
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
{/* Mobile: Single column layout */}
              {monthlyPricing.map((pricing) => (
                <TableRow key={`pricing-mobile-${pricing.months}`} className="md:hidden">
                  <TableCell className="py-4 text-sm text-[#373940] whitespace-nowrap">
                    {pricing.months} month{pricing.months !== 1 && 's'}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9,]*"
                        className="pl-7 text-base"
                        placeholder="0"
                        value={formatNumberWithCommas(pricing.price)}
                        tabIndex={2 + pricing.months}
                        onChange={createNumberChangeHandler((value) => updateMonthPricing(pricing.months, value), false, 10000000, true)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <BrandCheckbox
                      name={`utilities-${pricing.months}`}
                      checked={pricing.utilitiesIncluded}
                      tabIndex={14 + pricing.months}
                      className="focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-200"
                      onChange={(e) => 
                        updateMonthUtilities(pricing.months, e.target.checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Desktop: Two column layout */}
              {Array.from({ length: Math.ceil(monthlyPricing.length / 2) }, (_, rowIndex) => {
                const halfLength = Math.ceil(monthlyPricing.length / 2);
                const leftPricing = monthlyPricing[rowIndex];
                const rightPricing = monthlyPricing[rowIndex + halfLength];
                
                return (
                  <TableRow key={`pricing-row-${rowIndex}`} className="hidden md:table-row">
                    <TableCell className="py-4 text-sm text-[#373940] whitespace-nowrap">
                      {leftPricing.months} month{leftPricing.months !== 1 && 's'}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9,]*"
                          className="pl-7 text-base"
                          placeholder="0"
                          value={formatNumberWithCommas(leftPricing.price)}
                          tabIndex={2 + leftPricing.months}
                          onChange={createNumberChangeHandler((value) => updateMonthPricing(leftPricing.months, value), false, 10000000, true)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <BrandCheckbox
                        name={`utilities-${leftPricing.months}`}
                        checked={leftPricing.utilitiesIncluded}
                        tabIndex={14 + leftPricing.months}
                        className="focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-200"
                        onChange={(e) => 
                          updateMonthUtilities(leftPricing.months, e.target.checked)
                        }
                      />
                    </TableCell>
                    {rightPricing ? (
                      <>
                        <TableCell className="py-4 text-sm text-[#373940] whitespace-nowrap">
                          {rightPricing.months} month{rightPricing.months !== 1 && 's'}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9,]*"
                              className="pl-7 text-base"
                              placeholder="0"
                              value={formatNumberWithCommas(rightPricing.price)}
                              tabIndex={2 + rightPricing.months}
                              onChange={createNumberChangeHandler((value) => updateMonthPricing(rightPricing.months, value), false, 10000000, true)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <BrandCheckbox
                            name={`utilities-${rightPricing.months}`}
                            checked={rightPricing.utilitiesIncluded}
                            tabIndex={14 + rightPricing.months}
                            className="focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-200"
                            onChange={(e) => 
                              updateMonthUtilities(rightPricing.months, e.target.checked)
                            }
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ListingCreationVerifyPricing;

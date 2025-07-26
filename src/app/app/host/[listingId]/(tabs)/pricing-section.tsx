"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { ListingCreationCounter } from '@/app/app/host/add-property/listing-creation-counter';
import { PencilIcon } from 'lucide-react';
import { createNumberChangeHandler, createNumberBlurHandler } from '@/lib/number-validation';

interface LeaseTermPricing {
  months: number;
  price: string;
  utilitiesIncluded: boolean;
}

interface PricingSectionProps {
  editingSections: Record<string, boolean>;
  formData: any;
  currentListing: any;
  leaseTerms: LeaseTermPricing[];
  sectionHeaderStyles: string;
  labelStyles: string;
  valueStyles: string;
  containerId: string;
  containerQueryCSS: string;
  gridId: string;
  pricingData: Array<{
    id: string;
    label: string;
    value: string;
    width: string;
    valueStyle?: string;
  }>;
  toggleEdit: (section: string) => void;
  renderEditButtons: (section: string) => React.ReactNode;
  updateFormData: (field: string, value: any) => void;
  updateLeaseTermRange: (newShortestStay: number, newLongestStay: number) => void;
  updateLeaseTermPrice: (months: number, price: string) => void;
  updateLeaseTermUtilities: (months: number, utilitiesIncluded: boolean) => void;
  isRentDueAtBookingValid: () => boolean;
}

export function PricingSection({
  editingSections,
  formData,
  currentListing,
  leaseTerms,
  sectionHeaderStyles,
  labelStyles,
  valueStyles,
  containerId,
  containerQueryCSS,
  gridId,
  pricingData,
  toggleEdit,
  renderEditButtons,
  updateFormData,
  updateLeaseTermRange,
  updateLeaseTermPrice,
  updateLeaseTermUtilities,
  isRentDueAtBookingValid,
}: PricingSectionProps) {
  return (
    <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl">
      <CardContent className="flex flex-col gap-8 p-6">
        <div className="flex items-center justify-between w-full">
          <h2 className={sectionHeaderStyles}>
            Pricing & Lease Terms
          </h2>
          {editingSections['pricing'] ? renderEditButtons('pricing') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('pricing')} />}
        </div>

        {editingSections['pricing'] ? (
          <div className="space-y-6">
            {/* Form Inputs on Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sidebar rounded-lg p-4 shadow-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                <Input
                  type="text"
                  value={formData.depositSize || ''}
                  onChange={createNumberChangeHandler((value) => updateFormData('depositSize', parseInt(value.replace(/,/g, '')) || null), false, 10000000, true)}
                  onBlur={createNumberBlurHandler(formData.depositSize?.toString() || '', (value) => updateFormData('depositSize', parseInt(value.replace(/,/g, '')) || null), false, undefined, 10000000, true)}
                  className="mt-1"
                  placeholder="Security deposit amount"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Rent Due at Booking</label>
                <Input
                  type="text"
                  value={formData.rentDueAtBooking || ''}
                  onChange={createNumberChangeHandler((value) => updateFormData('rentDueAtBooking', parseInt(value.replace(/,/g, '')) || null), false, 10000000, true)}
                  onBlur={createNumberBlurHandler(formData.rentDueAtBooking?.toString() || '', (value) => updateFormData('rentDueAtBooking', parseInt(value.replace(/,/g, '')) || null), false, undefined, 10000000, true)}
                  className={`mt-1 ${!isRentDueAtBookingValid() ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Amount due at booking"
                />
                {!isRentDueAtBookingValid() && (
                  <div className="text-sm text-red-600 mt-1">
                    Rent due at booking cannot exceed the smallest monthly rent (${(() => {
                      const termsWithPrices = leaseTerms.filter(t => t.price && parseFloat(t.price) > 0);
                      if (termsWithPrices.length > 0) {
                        const allPrices = termsWithPrices.map(t => parseFloat(t.price));
                        const smallestRent = Math.min(...allPrices);
                        return `$${smallestRent.toLocaleString()}`;
                      }
                      return 'N/A';
                    })()})
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Pet Deposit</label>
                <Input
                  type="text"
                  value={formData.petDeposit || ''}
                  onChange={createNumberChangeHandler((value) => updateFormData('petDeposit', parseInt(value.replace(/,/g, '')) || null), false, 10000000, true)}
                  onBlur={createNumberBlurHandler(formData.petDeposit?.toString() || '', (value) => updateFormData('petDeposit', parseInt(value.replace(/,/g, '')) || null), false, undefined, 10000000, true)}
                  className="mt-1"
                  placeholder="Pet security deposit"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Pet Rent (Per Pet)</label>
                <Input
                  type="text"
                  value={formData.petRent || ''}
                  onChange={createNumberChangeHandler((value) => updateFormData('petRent', parseInt(value.replace(/,/g, '')) || null), false, 10000000, true)}
                  onBlur={createNumberBlurHandler(formData.petRent?.toString() || '', (value) => updateFormData('petRent', parseInt(value.replace(/,/g, '')) || null), false, undefined, 10000000, true)}
                  className="mt-1"
                  placeholder="Monthly pet rent per pet"
                />
              </div>
            </div>

            {/* Chart and Counters Container */}
            <div className="w-full mx-auto bg-sidebar rounded-lg p-4 shadow-lg">
              {/* Lease Terms Controls */}
              <div className="flex items-center justify-center gap-6 mb-4 flex-wrap mx-auto">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Shortest stay:
                  </label>
                  <ListingCreationCounter
                    value={Math.min(...leaseTerms.map(t => t.months))}
                    onChange={() => {}} // Handled by custom logic
                    min={1}
                    max={Math.max(...leaseTerms.map(t => t.months))}
                    variant="outline"
                    buttonSize="sm"
                    containerClassName='sm:min-w-[200px]'
                    textSize="lg"
                    monthSuffixClassName="hidden md:inline"
                    onDecrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentShortest > 1) {
                        updateLeaseTermRange(currentShortest - 1, currentLongest);
                      }
                    }}
                    onIncrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentShortest < currentLongest) {
                        updateLeaseTermRange(currentShortest + 1, currentLongest);
                      }
                    }}
                    decrementDisabled={Math.min(...leaseTerms.map(t => t.months)) <= 1}
                    incrementDisabled={Math.min(...leaseTerms.map(t => t.months)) >= Math.max(...leaseTerms.map(t => t.months))}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Longest stay:
                  </label>
                  <ListingCreationCounter
                    value={Math.max(...leaseTerms.map(t => t.months))}
                    onChange={() => {}} // Handled by custom logic
                    min={Math.min(...leaseTerms.map(t => t.months))}
                    max={12}
                    containerClassName='sm:min-w-[200px]'
                    variant="outline"
                    buttonSize="sm"
                    textSize="lg"
                    monthSuffixClassName="hidden md:inline"
                    onDecrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentLongest > currentShortest) {
                        updateLeaseTermRange(currentShortest, currentLongest - 1);
                      }
                    }}
                    onIncrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentLongest < 12) {
                        updateLeaseTermRange(currentShortest, currentLongest + 1);
                      }
                    }}
                    decrementDisabled={Math.max(...leaseTerms.map(t => t.months)) <= Math.min(...leaseTerms.map(t => t.months))}
                    incrementDisabled={Math.max(...leaseTerms.map(t => t.months)) >= 12}
                  />
                </div>
              </div>

              {/* Lease Terms Grid - Optimized for ~290px card width */}
              <div className={containerId}>
                <style dangerouslySetInnerHTML={{ __html: containerQueryCSS }} />
                <div className={gridId}>
                  {leaseTerms.map((term) => (
                  <div 
                    key={term.months}
                    className="bg-white border border-[#e7f0f0] rounded-lg p-4 max-w-[310px] mx-auto"
                  >
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-[#373940]">
                        {term.months} month{term.months !== 1 ? 's' : ''}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#475467] mb-1 block">
                          Monthly Rent
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                          <Input
                            className="pl-7 text-xs"
                            placeholder="0.00"
                            value={term.price}
                            tabIndex={100 + (term.months * 2 - 1)}
                            type="text"
                            onChange={createNumberChangeHandler((value) => updateLeaseTermPrice(term.months, value.replace(/,/g, '')), false, 10000000, true)}
                            onBlur={createNumberBlurHandler(term.price || '', (value) => updateLeaseTermPrice(term.months, value.replace(/,/g, '')), false, undefined, 10000000, true)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BrandCheckbox
                          id={`utilities-${term.months}`}
                          name={`utilities-${term.months}`}
                          checked={term.utilitiesIncluded}
                          tabIndex={100 + (term.months * 2)}
                          onChange={(e) => 
                            updateLeaseTermUtilities(term.months, e.target.checked)
                          }
                        />
                        <label htmlFor={`utilities-${term.months}`} className="text-xs font-medium text-[#475467] cursor-pointer">
                          Utilities Included
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
              
              {/* Pricing validation feedback */}
              {(() => {
                const emptyFields = leaseTerms.filter(t => !t.price || t.price.trim() === '' || t.price.trim() === '0');
                
                if (emptyFields.length > 0) {
                  return (
                    <div className="text-sm text-center text-red-600 mt-4">
                      All monthly rent fields must be filled in with values greater than $0
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {pricingData.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-1.5 ${item.width}`}
              >
                <div className={labelStyles}>
                  {item.label}
                </div>
                <div className={valueStyles}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
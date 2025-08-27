"use client";

import React from 'react';

/**
 * DATABASE SCHEMA - PRICING SECTION FIELDS
 * 
 * From Listing model in Prisma schema:
 * - depositSize: Int? @default(0) (security deposit amount)
 * - petDeposit: Int? @default(0) (pet security deposit)
 * - petRent: Int? @default(0) (monthly pet rent per pet)
 * - reservationDeposit: Int? @default(0) (reservation deposit)
 * - rentDueAtBooking: Int? @default(0) (rent due at booking)
 * - shortestLeaseLength: Int @default(1) (minimum lease length in months)
 * - longestLeaseLength: Int @default(12) (maximum lease length in months)
 * - shortestLeasePrice: Int @default(4000) (price for shortest lease)
 * - longestLeasePrice: Int @default(3500) (price for longest lease)
 * - utilitiesIncluded: Boolean @default(false) (utilities included flag)
 * 
 * Related model - ListingMonthlyPricing:
 * - id: String @id @default(uuid())
 * - listingId: String
 * - months: Int (1-12, number of months for this pricing tier)
 * - price: Int (monthly rent for this duration)
 * - utilitiesIncluded: Boolean @default(false)
 * - createdAt: DateTime @default(now())
 * - updatedAt: DateTime @updatedAt
 * - @@unique([listingId, months]) (one price per month length per listing)
 */
interface ListingPricingSchema {
  depositSize: number | null;
  petDeposit: number | null;
  petRent: number | null;
  reservationDeposit: number | null;
  shortestLeaseLength: number;
  longestLeaseLength: number;
  shortestLeasePrice: number;
  longestLeasePrice: number;
  utilitiesIncluded: boolean;
}

interface ListingMonthlyPricingSchema {
  id: string;
  listingId: string;
  months: number; // 1-12 months
  price: number; // Monthly rent amount
  utilitiesIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

import { ListingAndImages } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2, PencilIcon } from 'lucide-react';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { ListingCreationCounter } from '@/app/app/host/add-property/listing-creation-counter';

interface LeaseTermPricing {
  months: number;
  price: string;
  utilitiesIncluded: boolean;
}

interface ListingSummaryPricingProps {
  listing: ListingAndImages;
  formData: any;
  leaseTerms: LeaseTermPricing[];
  isEditing: boolean;
  buttonState: 'saving' | 'success' | 'failed' | null;
  isSaving: boolean;
  hasChanges: boolean;
  isValid: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdateField: (field: string, value: any) => void;
  onUpdateLeaseTermRange: (newShortest: number, newLongest: number) => void;
  onUpdateLeaseTermPrice: (months: number, price: string) => void;
  onUpdateLeaseTermUtilities: (months: number, utilitiesIncluded: boolean) => void;
}

const ListingSummaryPricing: React.FC<ListingSummaryPricingProps> = ({
  listing,
  formData,
  leaseTerms,
  isEditing,
  buttonState,
  isSaving,
  hasChanges,
  isValid,
  onToggleEdit,
  onSave,
  onCancel,
  onUpdateField,
  onUpdateLeaseTermRange,
  onUpdateLeaseTermPrice,
  onUpdateLeaseTermUtilities,
}) => {
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";
  const labelStyles = "text-md font-normal text-gray-500";
  const valueStyles = "text-md font-medium text-gray-900";

  // Generate unique class names for container queries
  const containerId = `lease-terms-container-${listing.id}`;
  const gridId = `lease-terms-grid-${listing.id}`;
  
  // Container query CSS
  const containerQueryCSS = `
    .${containerId} {
      container-type: inline-size;
      width: 100%;
    }
    
    .${gridId} {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, 1fr);
    }
    
    @container (min-width: 1024px) {
      .${gridId} {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    @container (min-width: 1280px) {
      .${gridId} {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    @container (min-width: 1536px) {
      .${gridId} {
        grid-template-columns: repeat(5, 1fr);
      }
    }
  `;

  // Format price range
  const formatPriceRange = () => {
    if (listing.longestLeasePrice && listing.shortestLeasePrice) {
      if (listing.longestLeasePrice === listing.shortestLeasePrice) {
        return `$${listing.longestLeasePrice.toLocaleString()}`;
      }
      const lowerPrice = Math.min(listing.longestLeasePrice, listing.shortestLeasePrice);
      const higherPrice = Math.max(listing.longestLeasePrice, listing.shortestLeasePrice);
      return `$${lowerPrice.toLocaleString()} - $${higherPrice.toLocaleString()}`;
    } else if (listing.shortestLeasePrice) {
      return `$${listing.shortestLeasePrice.toLocaleString()}`;
    } else if (listing.longestLeasePrice) {
      return `$${listing.longestLeasePrice.toLocaleString()}`;
    }
    return 'Price not set';
  };

  // Format lease terms
  const formatLeaseTerms = () => {
    const terms = [];
    if (listing.shortestLeaseLength) terms.push(`${listing.shortestLeaseLength} months min`);
    if (listing.longestLeaseLength) terms.push(`${listing.longestLeaseLength} months max`);
    return terms.length > 0 ? terms.join(', ') : 'Not specified';
  };

  // Pricing data for display
  const pricingData = [
    {
      id: "monthly-rent",
      label: "Monthly Rent",
      value: formatPriceRange(),
      width: "w-full sm:w-[374px]",
      valueStyle: "font-text-label-medium-semi-bold",
    },
    {
      id: "security-deposit",
      label: "Security Deposit",
      value: listing.depositSize ? `$${listing.depositSize.toLocaleString()}` : 'Not specified',
      width: "w-full sm:w-[342px]",
      valueStyle: "font-text-label-medium-semi-bold",
    },
    {
      id: "pet-deposit",
      label: "Pet Deposit",
      value: listing.petDeposit ? `$${listing.petDeposit.toLocaleString()}` : (listing.petsAllowed ? "Not Specified" : "No Pets"),
      width: "w-full sm:w-[235px]",
      valueStyle: "font-text-label-medium-medium",
    },
    {
      id: "pet-rent",
      label: "Pet Rent (Per Pet)",
      value: listing.petRent ? `$${listing.petRent.toLocaleString()}/month` : (listing.petsAllowed ? "Not Specified" : "No Pets"),
      width: "w-full sm:w-[374px]",
      valueStyle: "font-text-label-medium-medium",
    },
    {
      id: "lease-terms",
      label: "Lease Terms",
      value: formatLeaseTerms(),
      width: "w-full sm:w-[370px]",
      valueStyle: "font-text-label-medium-medium",
    },
  ];

  // Render edit buttons
  const renderEditButtons = () => {
    const canSave = hasChanges && isValid;
    
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={buttonState === 'success' ? "default" : buttonState === 'failed' ? "destructive" : "default"}
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-full z-10' : ''}
              ${buttonState === 'success' ? 'bg-secondaryBrand hover:bg-secondaryBrand text-white' : 
                buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : 
                !canSave && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' : 
                canSave && !buttonState ? 'bg-secondaryBrand hover:bg-secondaryBrand/90 text-white' : ''}
            `}
            onClick={() => !buttonState && canSave && onSave()}
            disabled={isSaving || (buttonState === 'saving' || buttonState === 'failed') || (!buttonState && !canSave)}
          >
            {buttonState === 'saving' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : buttonState === 'success' ? (
              <span>Success!</span>
            ) : buttonState === 'failed' ? (
              <span>Failed!</span>
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-0 opacity-0 overflow-hidden p-0' : ''}
              ${!canSave ? 'opacity-100' : ''}
            `}
            onClick={onCancel}
            disabled={isSaving || !!buttonState}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3"
        onClick={onToggleEdit}
      >
        <PencilIcon className="w-6 h-6" />
      </Button>
    );
  };

  return (
    <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl">
      <CardContent className="flex flex-col gap-8 p-6">
        <div className="flex items-center justify-between w-full">
          <h2 className={sectionHeaderStyles}>Pricing & Lease Terms</h2>
          {renderEditButtons()}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Form Inputs on Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sidebar rounded-lg p-4 shadow-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.depositSize || ''}
                  onChange={(e) => onUpdateField('depositSize', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="Security deposit amount"
                />
              </div>


              <div>
                <label className="text-sm font-medium text-gray-700">Pet Deposit</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.petDeposit || ''}
                  onChange={(e) => onUpdateField('petDeposit', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="Pet security deposit"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Pet Rent (Per Pet)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.petRent || ''}
                  onChange={(e) => onUpdateField('petRent', parseInt(e.target.value) || null)}
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
                    textSize="lg"
                    monthSuffixClassName="hidden md:inline"
                    onDecrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentShortest > 1) {
                        onUpdateLeaseTermRange(currentShortest - 1, currentLongest);
                      }
                    }}
                    onIncrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentShortest < currentLongest) {
                        onUpdateLeaseTermRange(currentShortest + 1, currentLongest);
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
                    variant="outline"
                    buttonSize="sm"
                    textSize="lg"
                    monthSuffixClassName="hidden md:inline"
                    onDecrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentLongest > currentShortest) {
                        onUpdateLeaseTermRange(currentShortest, currentLongest - 1);
                      }
                    }}
                    onIncrement={() => {
                      const currentShortest = Math.min(...leaseTerms.map(t => t.months));
                      const currentLongest = Math.max(...leaseTerms.map(t => t.months));
                      if (currentLongest < 12) {
                        onUpdateLeaseTermRange(currentShortest, currentLongest + 1);
                      }
                    }}
                    decrementDisabled={Math.max(...leaseTerms.map(t => t.months)) <= Math.min(...leaseTerms.map(t => t.months))}
                    incrementDisabled={Math.max(...leaseTerms.map(t => t.months)) >= 12}
                  />
                </div>
              </div>

              {/* Lease Terms Grid */}
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
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              onUpdateLeaseTermPrice(term.months, value);
                            }}
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
                            onUpdateLeaseTermUtilities(term.months, e.target.checked)
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
};

export default ListingSummaryPricing;
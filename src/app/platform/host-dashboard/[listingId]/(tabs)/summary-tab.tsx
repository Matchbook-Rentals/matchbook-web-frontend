"use client";

import React, { useState } from 'react';
import { ListingAndImages } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Home, MapPin, DollarSign, Calendar, User, Bed, Bath, Square, Wifi, Car, Heart, Users, Building, PawPrint, Edit, Check, X, Plus, Minus } from 'lucide-react';
import Tile from '@/components/ui/tile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateListing } from '@/app/actions/listings';
import { toast } from '@/components/ui/use-toast';
import { PropertyType } from '@/constants/enums';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { iconAmenities } from '@/lib/amenities-list';

// Amenity options grouped by category (same as listing creation)
const AMENITY_GROUPS = [
  {
    group: 'Accessibility & Safety',
    items: [
      { value: 'wheelchairAccess', label: 'Wheelchair Accessible', icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-1 mt-0" /> },
      { value: 'alarmSystem', label: 'Alarm System', icon: <AmenitiesIcons.UpdatedAlarmSystemIcon className="p-1 mt-0" /> },
      { value: 'gatedEntry', label: 'Gated Entry', icon: <AmenitiesIcons.UpdatedGatedEntryIcon className="p-1 mt-0" /> },
      { value: 'smokeDetector', label: 'Smoke Detector', icon: <AmenitiesIcons.UpdatedSmokeDetectorIcon className="p-1 mt-0" /> },
      { value: 'carbonMonoxide', label: 'CO Detector', icon: <AmenitiesIcons.UpdatedCarbonMonoxideDetectorIcon className="p-1 mt-0" /> },
      { value: 'security', label: 'Security System', icon: <AmenitiesIcons.UpdatedSecurityIcon className="p-1 mt-0" /> },
    ]
  },
  {
    group: 'Location & Views',
    items: [
      { value: 'mountainView', label: 'Mountain View', icon: <AmenitiesIcons.UpdatedMountainViewIcon className="p-1 mt-0" /> },
      { value: 'cityView', label: 'City View', icon: <AmenitiesIcons.UpdatedCityViewIcon className="p-1 mt-0" /> },
      { value: 'waterfront', label: 'Waterfront', icon: <AmenitiesIcons.UpdatedWaterfrontIcon className="p-0 mt-1" /> },
      { value: 'waterView', label: 'Water View', icon: <AmenitiesIcons.UpdatedWaterViewIcon className="p-1 mt-0" /> },
    ]
  },
  {
    group: 'Kitchen',
    items: [
      { value: 'dishwasher', label: 'Dishwasher', icon: <AmenitiesIcons.UpdatedDishwasherIcon className="p-1 mt-0" /> },
      { value: 'fridge', label: 'Refrigerator', icon: <AmenitiesIcons.UpdatedFridgeIcon className="p-1 mt-0 " /> },
      { value: 'oven', label: 'Oven/Stove', icon: <AmenitiesIcons.UpdatedOvenIcon className="p-1 mt-0" /> },
      { value: 'grill', label: 'Grill', icon: <AmenitiesIcons.UpdatedGrillIcon className="p-1" /> },
    ]
  },
  {
    group: 'Climate Control & Workspace',
    items: [
      { value: 'fireplace', label: 'Fireplace', icon: <AmenitiesIcons.UpdatedFireplaceIcon className="p-1 mt-0" /> },
      { value: 'heater', label: 'Heater', icon: <AmenitiesIcons.UpdatedHeaterIcon className="p-1 mt-0" /> },
      { value: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: <AmenitiesIcons.UpdatedDedicatedWorkspaceIcon className="p-1 mt-0" /> },
      { value: 'airConditioner', label: 'Air Conditioning', icon: <AmenitiesIcons.UpdatedAirConditioningIcon className="p-1 mt-0" /> },
    ]
  },
  {
    group: 'Luxury & Recreation',
    items: [
      { value: 'gym', label: 'Gym', icon: <AmenitiesIcons.UpdatedGymIcon className="p-1 mt-0" /> },
      { value: 'sauna', label: 'Sauna', icon: <AmenitiesIcons.UpdatedSaunaIcon className="p-1 mt-0" /> },
      { value: 'balcony', label: 'Balcony', icon: <AmenitiesIcons.UpdatedBalconyIcon className="p-1 mt-0" /> },
      { value: 'pool', label: 'Pool', icon: <AmenitiesIcons.PoolIcon className="p-0 mt-2" /> },
      { value: 'hotTub', label: 'Hot Tub', icon: <AmenitiesIcons.UpdatedHotTubIcon className="p-1 mt-0" /> },
      { value: 'patio', label: 'Patio', icon: <AmenitiesIcons.UpdatedPatioIcon className="p-1 mt-0" /> },
    ]
  },
];

interface SummaryTabProps {
  listing: ListingAndImages;
  onListingUpdate?: (updatedListing: ListingAndImages) => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ listing, onListingUpdate }) => {
  // Edit state management
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState(listing);
  const [currentListing, setCurrentListing] = useState(listing);
  const [isSaving, setIsSaving] = useState(false);
  const [buttonStates, setButtonStates] = useState<Record<string, 'saving' | 'success' | 'failed' | null>>({});

  // Define which fields belong to each section
  const sectionFields: Record<string, string[]> = {
    basic: ['category', 'furnished', 'title', 'petsAllowed'],
    location: ['streetAddress1', 'streetAddress2', 'city', 'state', 'postalCode'],
    details: ['roomCount', 'bathroomCount', 'squareFootage'],
    pricing: ['shortestLeasePrice', 'longestLeasePrice', 'shortestLeaseLength', 'longestLeaseLength', 'depositSize'],
    amenities: ['wifi', 'parking', 'kitchen', 'laundryFacilities', 'airConditioner', 'heater', 'dedicatedWorkspace', 'wheelchairAccess', 'security', 'alarmSystem', 'gatedEntry', 'smokeDetector', 'carbonMonoxide', 'waterfront', 'beachfront', 'mountainView', 'cityView', 'waterView', 'dishwasher', 'fridge', 'oven', 'stove', 'grill', 'fireplace', 'pool', 'balcony', 'patio', 'hotTub', 'gym', 'sauna', 'tv', 'microwave', 'elevator'],
    // Note: petRent and petSecurityDeposit are not yet in the database schema and should not be sent to server
    description: ['description']
  };

  // Check if a section has changes
  const hasChanges = (section: string) => {
    const fields = sectionFields[section] || [];
    return fields.some(field => {
      const currentValue = formData[field as keyof typeof formData];
      const originalValue = currentListing[field as keyof typeof currentListing];
      
      // Handle different types of comparisons
      if (currentValue === undefined && originalValue === undefined) return false;
      if (currentValue === null && originalValue === null) return false;
      if (currentValue === '' && (originalValue === null || originalValue === undefined)) return false;
      
      return currentValue !== originalValue;
    });
  };

  // Check if a section passes validation
  const isValidSection = (section: string) => {
    if (section === 'description') {
      const charCount = (formData.description || '').length;
      return charCount >= 20 && charCount <= 1000;
    }
    return true; // Other sections don't have validation currently
  };

  // Toggle edit mode for a section
  const toggleEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    // Reset form data when entering edit mode
    if (!editingSections[section]) {
      setFormData(currentListing);
    }
  };

  // Cancel editing
  const cancelEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false
    }));
    setFormData(currentListing); // Reset to current saved data
  };

  // Save changes
  const saveChanges = async (section: string) => {
    setIsSaving(true);
    setButtonStates(prev => ({ ...prev, [section]: 'saving' }));
    
    try {
      // Only save the fields that belong to this section
      const fields = sectionFields[section] || [];
      const updateData: any = {};
      
      fields.forEach(field => {
        const currentValue = formData[field as keyof typeof formData];
        const originalValue = currentListing[field as keyof typeof currentListing];
        
        // Only include fields that have changed
        if (currentValue !== originalValue) {
          updateData[field] = currentValue;
        }
      });
      
      if (Object.keys(updateData).length > 0) {
        console.log(`Saving section '${section}' with data:`, updateData);
        await updateListing(listing.id, updateData);
        
        // Update the current listing with the new data
        const updatedListing = { ...currentListing, ...updateData };
        setCurrentListing(updatedListing);
        
        // Call the optional callback to update parent component
        if (onListingUpdate) {
          onListingUpdate(updatedListing);
        }
      } else {
        console.log(`No changes detected for section '${section}'`);
      }
      
      // Show success state
      setButtonStates(prev => ({ ...prev, [section]: 'success' }));
      
      // Wait for animation to complete, then close edit mode
      setTimeout(() => {
        setEditingSections(prev => ({
          ...prev,
          [section]: false
        }));
        setButtonStates(prev => ({ ...prev, [section]: null }));
      }, 1500);
      
    } catch (error) {
      console.error('Error updating listing:', error);
      
      // Show failed state
      setButtonStates(prev => ({ ...prev, [section]: 'failed' }));
      
      // Reset after delay
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [section]: null }));
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Render edit buttons
  const renderEditButtons = (section: string) => {
    const isEditing = editingSections[section];
    const buttonState = buttonStates[section];
    const sectionHasChanges = hasChanges(section);
    const sectionIsValid = isValidSection(section);
    const canSave = sectionHasChanges && sectionIsValid;
    
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={buttonState === 'success' ? "default" : buttonState === 'failed' ? "destructive" : "default"}
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-full z-10' : ''}
              ${!canSave && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' : ''}
              ${canSave && !buttonState ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              ${buttonState === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}
              ${buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : ''}
            `}
            onClick={() => !buttonState && canSave && saveChanges(section)}
            disabled={isSaving || !!buttonState || !canSave}
          >
            {buttonState === 'saving' ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            onClick={() => cancelEdit(section)}
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
        onClick={() => toggleEdit(section)}
      >
        <Edit className="h-4 w-4" />
      </Button>
    );
  };
  // Format property type display
  const formatPropertyType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    // Handle the specific property type values with proper formatting
    const propertyTypeLabels: { [key: string]: string } = {
      'singleFamily': 'Single Family',
      'apartment': 'Apartment',
      'townhouse': 'Townhouse',
      'privateRoom': 'Private Room'
    };
    
    return propertyTypeLabels[type] || type;
  };

  // Format furnished status
  const formatFurnished = (furnished: boolean | undefined) => {
    return furnished ? 'Furnished' : 'Unfurnished';
  };

  // Format price range
  const formatPriceRange = () => {
    if (currentListing.longestLeasePrice && currentListing.shortestLeasePrice) {
      if (currentListing.longestLeasePrice === currentListing.shortestLeasePrice) {
        return `$${currentListing.longestLeasePrice.toLocaleString()}`;
      }
      const lowerPrice = Math.min(currentListing.longestLeasePrice, currentListing.shortestLeasePrice);
      const higherPrice = Math.max(currentListing.longestLeasePrice, currentListing.shortestLeasePrice);
      return `$${lowerPrice.toLocaleString()} - $${higherPrice.toLocaleString()}`;
    } else if (currentListing.shortestLeasePrice) {
      return `$${currentListing.shortestLeasePrice.toLocaleString()}`;
    } else if (currentListing.longestLeasePrice) {
      return `$${currentListing.longestLeasePrice.toLocaleString()}`;
    }
    return 'Price not set';
  };

  // Format lease terms
  const formatLeaseTerms = () => {
    const terms = [];
    if (currentListing.shortestLeaseLength) terms.push(`${currentListing.shortestLeaseLength} months min`);
    if (currentListing.longestLeaseLength) terms.push(`${currentListing.longestLeaseLength} months max`);
    return terms.length > 0 ? terms.join(', ') : 'Not specified';
  };

  // Format address
  const formatAddress = () => {
    const parts = [
      currentListing.streetAddress1,
      currentListing.streetAddress2,
      currentListing.city,
      currentListing.state,
      currentListing.postalCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Format room details
  const formatRoomDetails = () => {
    const beds = currentListing.bedrooms?.length || currentListing.roomCount || 0;
    const baths = currentListing.bathroomCount || 0;
    const sqft = currentListing.squareFootage || 'N/A';
    return { beds, baths, sqft };
  };

  // Get display amenities using the same approach as listing-info component
  const getDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if ((currentListing as any)[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  // Get selected amenities for editing
  const getSelectedAmenities = () => {
    const selected: string[] = [];
    const allAmenities = AMENITY_GROUPS.flatMap(group => group.items);
    
    allAmenities.forEach(amenity => {
      if ((formData as any)[amenity.value]) {
        selected.push(amenity.value);
      }
    });
    
    return selected;
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityValue: string) => {
    const currentValue = (formData as any)[amenityValue];
    updateFormData(amenityValue, !currentValue);
  };

  const roomDetails = formatRoomDetails();
  const displayAmenities = getDisplayAmenities();

  return (
    <div className="space-y-6 p-6">

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Highlights
            </div>
            {renderEditButtons('basic')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingSections['basic'] ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Property Title</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className="mt-1"
                  placeholder="Enter property title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Property Type</label>
                <Select value={formData.category || ''} onValueChange={(value) => updateFormData('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PropertyType.SingleFamily}>Single Family</SelectItem>
                    <SelectItem value={PropertyType.Apartment}>Apartment</SelectItem>
                    <SelectItem value={PropertyType.Townhouse}>Townhouse</SelectItem>
                    <SelectItem value={PropertyType.PrivateRoom}>Private Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Furnished Status</label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={formData.furnished || false}
                    onCheckedChange={(checked) => updateFormData('furnished', checked)}
                  />
                  <span className="text-sm">{formData.furnished ? 'Furnished' : 'Unfurnished'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pets Allowed</label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={formData.petsAllowed || false}
                    onCheckedChange={(checked) => updateFormData('petsAllowed', checked)}
                  />
                  <span className="text-sm">{formData.petsAllowed ? 'Pets allowed' : 'No pets'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentListing.title && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Property Title</label>
                  <p className="mt-1 text-lg font-semibold">{currentListing.title}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Property Type</label>
                <div className="mt-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>{formatPropertyType(currentListing.category)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Furnished Status</label>
                <div className="mt-1 flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  <span>{formatFurnished(currentListing.furnished)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pets Allowed</label>
                <div className="mt-1 flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-gray-500" />
                  <span>{currentListing.petsAllowed ? 'Pets allowed' : 'No pets'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Description</span>
            {renderEditButtons('description')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSections['description'] ? (
            <div>
              <label className="text-sm font-medium text-gray-700">Property Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="mt-1"
                placeholder="Describe your property..."
                rows={6}
              />
              <div className="mt-1 text-sm">
                {(() => {
                  const charCount = (formData.description || '').length;
                  if (charCount < 20) {
                    return (
                      <span className="text-red-600">
                        {20 - charCount} characters more required
                      </span>
                    );
                  } else if (charCount >= 20 && charCount <= 1000) {
                    return (
                      <span className="text-green-600">
                        {charCount}/1000 characters used
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-red-600">
                        {charCount}/1000 characters used
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentListing.description || 'No description provided.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </div>
            {renderEditButtons('location')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSections['location'] ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Street Address</label>
                <Input
                  value={formData.streetAddress1 || ''}
                  onChange={(e) => updateFormData('streetAddress1', e.target.value)}
                  className="mt-1"
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Apartment/Unit (Optional)</label>
                <Input
                  value={formData.streetAddress2 || ''}
                  onChange={(e) => updateFormData('streetAddress2', e.target.value)}
                  className="mt-1"
                  placeholder="Apt, suite, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="mt-1"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <Input
                    value={formData.state || ''}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className="mt-1"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                  <Input
                    value={formData.postalCode || ''}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    className="mt-1"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">{formatAddress()}</p>
          )}
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property Details
            </div>
            {renderEditButtons('details')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSections['details'] ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                <div className="flex items-center gap-3 border rounded-md px-3 py-2 mt-1 w-fit mx-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => updateFormData('roomCount', Math.max(0, (formData.roomCount || 0) - 1))}
                    disabled={(formData.roomCount || 0) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[2rem] text-center">{formData.roomCount || 0}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => updateFormData('roomCount', (formData.roomCount || 0) + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                <div className="flex items-center gap-3 border rounded-md px-3 py-2 mt-1 w-fit mx-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => updateFormData('bathroomCount', Math.max(0, (formData.bathroomCount || 0) - 0.5))}
                    disabled={(formData.bathroomCount || 0) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[2rem] text-center">{formData.bathroomCount || 0}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => updateFormData('bathroomCount', (formData.bathroomCount || 0) + 0.5)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Square Feet</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.squareFootage || ''}
                  onChange={(e) => updateFormData('squareFootage', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="Square footage"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-gray-500" />
                <span>{roomDetails.beds} Bedroom{roomDetails.beds !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-gray-500" />
                <span>{roomDetails.baths} Bathroom{roomDetails.baths !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-gray-500" />
                <span>{roomDetails.sqft} Sqft</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing & Lease Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Lease Terms
            </div>
            {renderEditButtons('pricing')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingSections['pricing'] ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Shortest Lease Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.shortestLeasePrice || ''}
                    onChange={(e) => updateFormData('shortestLeasePrice', parseInt(e.target.value) || null)}
                    className="mt-1"
                    placeholder="Shortest lease monthly rent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Longest Lease Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.longestLeasePrice || ''}
                    onChange={(e) => updateFormData('longestLeasePrice', parseInt(e.target.value) || null)}
                    className="mt-1"
                    placeholder="Longest lease monthly rent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Shortest Lease Length (months)</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.shortestLeaseLength || ''}
                    onChange={(e) => updateFormData('shortestLeaseLength', parseInt(e.target.value) || null)}
                    className="mt-1"
                    placeholder="Min lease term"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Longest Lease Length (months)</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.longestLeaseLength || ''}
                    onChange={(e) => updateFormData('longestLeaseLength', parseInt(e.target.value) || null)}
                    className="mt-1"
                    placeholder="Max lease term"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Security Deposit ($)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.depositSize || ''}
                  onChange={(e) => updateFormData('depositSize', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="Security deposit amount"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Monthly Rent</label>
                  <p className="text-2xl font-bold text-gray-800">{formatPriceRange()}</p>
                </div>
                {currentListing.depositSize && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                    <p className="text-lg font-semibold text-gray-800">${currentListing.depositSize.toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Note: Pet rent and pet security deposit fields are not yet in database schema */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Pet Rent</label>
                  <p className="text-gray-700">Not specified</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pet Security Deposit</label>
                  <p className="text-gray-700">Not specified</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Lease Terms</label>
                <p className="text-gray-700">{formatLeaseTerms()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Amenities */}
      {(displayAmenities.length > 0 || editingSections['amenities']) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Amenities
              </div>
              {renderEditButtons('amenities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingSections['amenities'] ? (
              <div className="flex flex-col gap-4">
                  {AMENITY_GROUPS.map((group) => (
                    <div key={group.group} className="space-y-4 border-b pb-4">
                      <h3 className="text-[16px] font-medium text-[#404040]">{group.group}</h3>
                      <div className="flex flex-wrap gap-3">
                        {group.items.map((amenity) => (
                          <Tile
                            key={amenity.value}
                            label={amenity.label}
                            icon={amenity.icon}
                            className={`cursor-pointer border-2 w-[77px] h-[87px] ${
                              (formData as any)[amenity.value] 
                                ? 'border-primary shadow-lg' 
                                : 'border-[#E3E3E3]'
                            }`}
                            labelClassNames="text-xs"
                            onClick={() => toggleAmenity(amenity.value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
              displayAmenities.length > 0 && (
                <div className="grid grid-cols-2 gap-y-6 mb-4">
                  {displayAmenities.map((amenity, index) => {
                    const IconComponent = amenity.icon;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-[30px] h-[30px] flex items-center justify-center">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-normal text-black">
                          {amenity.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {currentListing.listingImages && currentListing.listingImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos ({currentListing.listingImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentListing.listingImages.slice(0, 8).map((image, index) => (
                <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {currentListing.listingImages.length > 8 && (
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    +{currentListing.listingImages.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default SummaryTab;
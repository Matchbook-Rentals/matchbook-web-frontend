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
import { Home, MapPin, DollarSign, Calendar, User, Bed, Bath, Square, Wifi, Car, Heart, Users, Building, PawPrint, Edit, Check, X } from 'lucide-react';
import { updateListing } from '@/app/actions/listings';
import { toast } from '@/components/ui/use-toast';

interface SummaryTabProps {
  listing: ListingAndImages;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ listing }) => {
  // Edit state management
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState(listing);
  const [isSaving, setIsSaving] = useState(false);
  const [buttonStates, setButtonStates] = useState<Record<string, 'saving' | 'success' | 'failed' | null>>({});

  // Define which fields belong to each section
  const sectionFields: Record<string, string[]> = {
    basic: ['propertyType', 'furnished', 'title'],
    location: ['streetAddress1', 'streetAddress2', 'city', 'state', 'postalCode'],
    details: ['roomCount', 'bathroomCount', 'squareFootage'],
    pricing: ['shortestLeasePrice', 'longestLeasePrice', 'shortestLeaseLength', 'longestLeaseLength', 'depositSize'],
    capacity: ['guestCount', 'petsAllowed'],
    description: ['description']
  };

  // Check if a section has changes
  const hasChanges = (section: string) => {
    const fields = sectionFields[section] || [];
    return fields.some(field => {
      const currentValue = formData[field as keyof typeof formData];
      const originalValue = listing[field as keyof typeof listing];
      
      // Handle different types of comparisons
      if (currentValue === undefined && originalValue === undefined) return false;
      if (currentValue === null && originalValue === null) return false;
      if (currentValue === '' && (originalValue === null || originalValue === undefined)) return false;
      
      return currentValue !== originalValue;
    });
  };

  // Toggle edit mode for a section
  const toggleEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    // Reset form data when entering edit mode
    if (!editingSections[section]) {
      setFormData(listing);
    }
  };

  // Cancel editing
  const cancelEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false
    }));
    setFormData(listing); // Reset to original data
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
        const originalValue = listing[field as keyof typeof listing];
        
        // Only include fields that have changed
        if (currentValue !== originalValue) {
          updateData[field] = currentValue;
        }
      });
      
      if (Object.keys(updateData).length > 0) {
        await updateListing(listing.id, updateData);
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
    
    if (isEditing) {
      return (
        <div className="relative flex gap-2 min-w-[120px]">
          <Button
            size="sm"
            variant={buttonState === 'success' ? "default" : buttonState === 'failed' ? "destructive" : "default"}
            className={`
              h-8 px-3 transition-all duration-300 ease-out
              ${buttonState ? 'w-full z-10' : ''}
              ${!sectionHasChanges && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}
              ${sectionHasChanges && !buttonState ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              ${buttonState === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}
              ${buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : ''}
            `}
            onClick={() => !buttonState && sectionHasChanges && saveChanges(section)}
            disabled={isSaving || !!buttonState || !sectionHasChanges}
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
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format furnished status
  const formatFurnished = (furnished: boolean | undefined) => {
    return furnished ? 'Furnished' : 'Unfurnished';
  };

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

  // Format address
  const formatAddress = () => {
    const parts = [
      listing.streetAddress1,
      listing.streetAddress2,
      listing.city,
      listing.state,
      listing.postalCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Format room details
  const formatRoomDetails = () => {
    const beds = listing.bedrooms?.length || listing.roomCount || 0;
    const baths = listing.bathroomCount || 0;
    const sqft = listing.squareFootage || 'N/A';
    return { beds, baths, sqft };
  };

  // Get amenity categories
  const getAmenityCategories = () => {
    const categories: { [key: string]: string[] } = {
      'Essential': [],
      'Comfort': [],
      'Entertainment': [],
      'Outdoor': [],
      'Kitchen': [],
      'Safety': [],
      'Other': []
    };

    // Define amenities with their display names and categories
    const amenityFields = [
      // Essential
      { field: 'wifi', display: 'WiFi', category: 'Essential' },
      { field: 'parking', display: 'Parking', category: 'Essential' },
      { field: 'kitchen', display: 'Kitchen', category: 'Essential' },
      { field: 'laundryFacilities', display: 'Laundry Facilities', category: 'Essential' },
      { field: 'dedicatedWorkspace', display: 'Dedicated Workspace', category: 'Essential' },
      
      // Comfort
      { field: 'airConditioner', display: 'Air Conditioning', category: 'Comfort' },
      { field: 'heater', display: 'Heating', category: 'Comfort' },
      { field: 'hotTub', display: 'Hot Tub', category: 'Comfort' },
      { field: 'elevator', display: 'Elevator', category: 'Comfort' },
      { field: 'wheelchairAccess', display: 'Wheelchair Access', category: 'Comfort' },
      
      // Entertainment
      { field: 'tv', display: 'Television', category: 'Entertainment' },
      { field: 'gym', display: 'Gym/Fitness Center', category: 'Entertainment' },
      { field: 'fitnessCenter', display: 'Fitness Center', category: 'Entertainment' },
      
      // Outdoor
      { field: 'pool', display: 'Pool', category: 'Outdoor' },
      { field: 'balcony', display: 'Balcony', category: 'Outdoor' },
      { field: 'patio', display: 'Patio', category: 'Outdoor' },
      { field: 'fireplace', display: 'Fireplace', category: 'Outdoor' },
      { field: 'grill', display: 'Grill', category: 'Outdoor' },
      { field: 'waterfront', display: 'Waterfront', category: 'Outdoor' },
      { field: 'beachfront', display: 'Beachfront', category: 'Outdoor' },
      
      // Kitchen
      { field: 'dishwasher', display: 'Dishwasher', category: 'Kitchen' },
      { field: 'microwave', display: 'Microwave', category: 'Kitchen' },
      { field: 'oven', display: 'Oven', category: 'Kitchen' },
      { field: 'stove', display: 'Stove', category: 'Kitchen' },
      { field: 'fridge', display: 'Refrigerator', category: 'Kitchen' },
      
      // Safety
      { field: 'smokeDetector', display: 'Smoke Detector', category: 'Safety' },
      { field: 'carbonMonoxide', display: 'Carbon Monoxide Detector', category: 'Safety' },
      { field: 'security', display: 'Security System', category: 'Safety' },
      { field: 'alarmSystem', display: 'Alarm System', category: 'Safety' },
    ];

    amenityFields.forEach(({ field, display, category }) => {
      if (listing[field as keyof typeof listing]) {
        categories[category].push(display);
      }
    });

    return categories;
  };

  const roomDetails = formatRoomDetails();
  const amenityCategories = getAmenityCategories();

  return (
    <div className="space-y-6 p-6">

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Basic Information
            </div>
            {renderEditButtons('basic')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingSections['basic'] ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Property Type</label>
                <Select value={formData.propertyType || ''} onValueChange={(value) => updateFormData('propertyType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_FAMILY">Single Family</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                    <SelectItem value="MULTI_FAMILY">Multi Family</SelectItem>
                    <SelectItem value="SINGLE_ROOM">Single Room</SelectItem>
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
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Property Title</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className="mt-1"
                  placeholder="Enter property title"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Property Type</label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {formatPropertyType(listing.propertyType)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Furnished Status</label>
                <div className="mt-1">
                  <Badge variant={listing.furnished ? "default" : "outline"} className="text-sm">
                    {formatFurnished(listing.furnished)}
                  </Badge>
                </div>
              </div>
              {listing.title && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Property Title</label>
                  <p className="mt-1 text-lg font-semibold">{listing.title}</p>
                </div>
              )}
            </div>
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
                <Input
                  type="number"
                  min="0"
                  value={formData.roomCount || ''}
                  onChange={(e) => updateFormData('roomCount', parseInt(e.target.value) || 0)}
                  className="mt-1"
                  placeholder="Number of bedrooms"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathroomCount || ''}
                  onChange={(e) => updateFormData('bathroomCount', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  placeholder="Number of bathrooms"
                />
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
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Rent</label>
                <p className="text-2xl font-bold text-green-600">{formatPriceRange()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Lease Terms</label>
                <p className="text-gray-700">{formatLeaseTerms()}</p>
              </div>
              {listing.depositSize && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                  <p className="text-gray-700">${listing.depositSize.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guests & Pets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Capacity
            </div>
            {renderEditButtons('capacity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSections['capacity'] ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Maximum Guests</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.guestCount || ''}
                  onChange={(e) => updateFormData('guestCount', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="Max number of guests"
                />
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
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>Max {listing.guestCount || 'Not specified'} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-gray-500" />
                <span>{listing.petsAllowed ? 'Pets allowed' : 'No pets'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      {Object.values(amenityCategories).some(amenities => amenities.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Amenities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(amenityCategories).map(([category, amenities]) => (
                amenities.length > 0 && (
                  <div key={category}>
                    <h4 className="font-semibold text-gray-700 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {listing.listingImages && listing.listingImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos ({listing.listingImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {listing.listingImages.slice(0, 8).map((image, index) => (
                <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {listing.listingImages.length > 8 && (
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    +{listing.listingImages.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {listing.description || 'No description provided.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryTab;
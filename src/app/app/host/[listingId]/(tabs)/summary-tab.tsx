"use client";

import React, { useState } from 'react';
import { ListingAndImages } from '@/types';
import { useListingDashboard } from '../listing-dashboard-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Home, MapPin, DollarSign, Calendar, User, Bed, Bath, Square, Wifi, Car, Heart, Users, Building, PawPrint, Edit, Check, X, Plus, Minus, Loader2, PencilIcon, Trash2 } from 'lucide-react';
import Tile from '@/components/ui/tile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateListing, updateListingPhotos } from '@/app/actions/listings';
import { toast } from '@/components/ui/use-toast';
import { PropertyType } from '@/constants/enums';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { iconAmenities } from '@/lib/amenities-list';
import { UploadButton } from "@/app/utils/uploadthing";

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
  const { updateListing: updateContextListing } = useListingDashboard();
  
  // Shared style constants
  const sectionHeaderStyles = "text-2xl font-semibold text-gray-900";
  const labelStyles = "text-md font-normal text-gray-500";
  const valueStyles = "text-md font-medium text-gray-900";
  const noLabelStyles = "text-md font-normal text-gray-500";
  // Edit state management
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState(listing);
  const [currentListing, setCurrentListing] = useState(listing);
  const [isSaving, setIsSaving] = useState(false);
  const [buttonStates, setButtonStates] = useState<Record<string, 'saving' | 'success' | 'failed' | null>>({});
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverTrash, setDragOverTrash] = useState(false);
  const [dropPreviewIndex, setDropPreviewIndex] = useState<number | null>(null);

  // Define which fields belong to each section
  const sectionFields: Record<string, string[]> = {
    basic: ['category', 'furnished', 'title', 'petsAllowed'],
    location: ['streetAddress1', 'streetAddress2', 'city', 'state', 'postalCode'],
    details: ['roomCount', 'bathroomCount', 'squareFootage'],
    pricing: ['shortestLeasePrice', 'longestLeasePrice', 'shortestLeaseLength', 'longestLeaseLength', 'depositSize'],
    amenities: ['wifi', 'parking', 'kitchen', 'laundryFacilities', 'airConditioner', 'heater', 'dedicatedWorkspace', 'wheelchairAccess', 'security', 'alarmSystem', 'gatedEntry', 'smokeDetector', 'carbonMonoxide', 'waterfront', 'beachfront', 'mountainView', 'cityView', 'waterView', 'dishwasher', 'fridge', 'oven', 'stove', 'grill', 'fireplace', 'pool', 'balcony', 'patio', 'hotTub', 'gym', 'sauna', 'tv', 'microwave', 'elevator'],
    // Note: petRent and petSecurityDeposit are not yet in the database schema and should not be sent to server
    description: ['description'],
    photos: [] // Photos are handled separately since they're a relation
  };

  // Check if a section has changes
  const hasChanges = (section: string) => {
    if (section === 'photos') {
      // Special handling for photos - compare the arrays
      const currentPhotos = formData.listingImages || [];
      const originalPhotos = currentListing.listingImages || [];
      
      if (currentPhotos.length !== originalPhotos.length) return true;
      
      return currentPhotos.some((photo, index) => {
        const originalPhoto = originalPhotos[index];
        return photo.id !== originalPhoto?.id || photo.url !== originalPhoto?.url;
      });
    }
    
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
      if (section === 'photos') {
        // Handle photos - save to database
        const photos = (formData.listingImages || []).map((photo, index) => ({
          id: photo.id,
          url: photo.url,
          category: photo.category,
          rank: index + 1
        }));
        
        console.log('Saving photos to database:', photos);
        const result = await updateListingPhotos(listing.id, photos);
        
        if (result) {
          // Update the current listing with the saved data
          const updatedListing = { ...currentListing, listingImages: result.listingImages };
          setCurrentListing(updatedListing);
          
          // Update the context with the new listing data
          updateContextListing(updatedListing);
          
          // Call the optional callback to update parent component
          if (onListingUpdate) {
            onListingUpdate(updatedListing);
          }
          
          console.log('Photos saved successfully to database');
        }
      } else {
        // Handle regular fields
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
          
          // Update the context with the new listing data
          updateContextListing(updatedListing);
          
          // Call the optional callback to update parent component
          if (onListingUpdate) {
            onListingUpdate(updatedListing);
          }
        } else {
          console.log(`No changes detected for section '${section}'`);
        }
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

  // Photo management functions
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (typeof index === 'number' && index !== dropPreviewIndex) {
      setDropPreviewIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear preview if we're leaving the entire photo grid area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropPreviewIndex(null);
    }
  };

  const handleDragEnterTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTrash(true);
  };

  const handleDragLeaveTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTrash(false);
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTrash(false);
    
    if (draggedImageId) {
      const updatedImages = formData.listingImages?.filter(img => img.id !== draggedImageId) || [];
      updateFormData('listingImages', updatedImages);
      setDraggedImageId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedImageId || !formData.listingImages) return;
    
    const draggedIndex = formData.listingImages.findIndex(img => img.id === draggedImageId);
    if (draggedIndex === -1) return;
    
    const updatedImages = [...formData.listingImages];
    const [draggedImage] = updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(targetIndex, 0, draggedImage);
    
    updateFormData('listingImages', updatedImages);
    setDraggedImageId(null);
    setDropPreviewIndex(null);
  };

  const handlePhotoUpload = (res: any[]) => {
    if (Array.isArray(res)) {
      const newPhotos = res.map((file) => ({
        id: file.key || Date.now().toString(),
        url: file.url,
        listingId: listing.id,
        category: null,
        rank: null,
      }));
      
      const currentImages = formData.listingImages || [];
      updateFormData('listingImages', [...currentImages, ...newPhotos]);
      
      toast({
        title: "Success",
        description: `${res.length} photo${res.length === 1 ? '' : 's'} uploaded successfully`,
        variant: "success"
      });
    }
  };

  const roomDetails = formatRoomDetails();
  const displayAmenities = getDisplayAmenities();

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
      value: currentListing.depositSize ? `$${currentListing.depositSize.toLocaleString()}` : 'Not specified',
      width: "w-full sm:w-[342px]",
      valueStyle: "font-text-label-medium-semi-bold",
    },
    {
      id: "pet-rent",
      label: "Pet Rent",
      value: "Not Specified",
      width: "w-full sm:w-[235px]",
      valueStyle: "font-text-label-medium-medium",
    },
    {
      id: "pet-security-deposit",
      label: "Pet Security Deposit",
      value: currentListing.petsAllowed ? "Not Specified" : "No Pets",
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

  return (
    <div className="space-y-6 p-0">

      {/* Highlights */}
      <Card className="p-6 flex flex-col gap-8 rounded-xl shadow-[0px_0px_5px_#00000029]">
        <div className="flex items-center justify-between w-full">
          <h2 className={sectionHeaderStyles}>
            Highlights
          </h2>
          {editingSections['basic'] ? renderEditButtons('basic') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('basic')} />}
        </div>

        {editingSections['basic'] ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Property Title</label>
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
          <CardContent className="flex items-start gap-6 p-0">
            <div className="flex flex-col items-start gap-1.5 w-[374px]">
              <div className={labelStyles}>
                Property Title
              </div>
              <div className={valueStyles}>
                {currentListing.title || 'No title'}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1.5 w-[212px]">
              <div className={labelStyles}>
                Property Type
              </div>
              <div className={valueStyles}>
                {formatPropertyType(currentListing.category)}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1.5 w-[235px]">
              <div className={labelStyles}>
                Furnished Status
              </div>
              <div className={valueStyles}>
                {formatFurnished(currentListing.furnished)}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className={labelStyles}>
                Pets Allowed
              </div>
              <div className={valueStyles}>
                {currentListing.petsAllowed ? 'Pets allowed' : 'No Pets'}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Description */}
      <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl">
        <CardContent className="p-6 flex flex-col gap-[18px]">
          <div className="flex items-center justify-between w-full">
            <h2 className={sectionHeaderStyles}>
              Description
            </h2>
            {editingSections['description'] ? renderEditButtons('description') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('description')} />}
          </div>

          {editingSections['description'] ? (
            <div className="flex flex-col gap-[18px] w-full">
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
            <div className="flex flex-col gap-[18px] w-full">
              <p className={`${noLabelStyles} whitespace-pre-wrap`}>
                {currentListing.description || 'No description provided.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location and Property Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location */}
        <Card className="flex-1 self-stretch shadow-[0px_0px_5px_#00000029] p-0">
          <CardContent className="flex flex-col items-end gap-[18px] p-6">
            <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
              <div className="relative flex-1 opacity-90 text-2xl font-semibold text-gray-900">
                Location
              </div>
              {editingSections['location'] ? renderEditButtons('location') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('location')} />}
            </div>

            {editingSections['location'] ? (
              <div className="space-y-4 w-full">
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
                <div className="grid grid-cols-1 gap-4">
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
              <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div className={noLabelStyles}>
                    {formatAddress()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="flex-1 shadow-[0px_0px_5px_#00000029] p-0">
          <CardContent className="flex flex-col items-end gap-[18px] p-6">
            <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
              <div className="flex-1 opacity-90 text-2xl font-semibold text-gray-900 relative mt-[-1.00px]">
                Property Details
              </div>
              {editingSections['details'] ? renderEditButtons('details') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('details')} />}
            </div>

            {editingSections['details'] ? (
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                  <div className="flex items-center gap-3 px-3 py-2 mt-1 w-fit mx-auto">
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
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                  <div className="flex items-center gap-3 px-3 py-2 mt-1 w-fit mx-auto">
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
                <div className="text-center">
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
              <div className="flex items-center gap-[41px] relative self-stretch w-full flex-[0_0_auto]">
                {/* Bedroom */}
                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
                  <Bed className="w-5 h-5 text-gray-500" />
                  <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                    {roomDetails.beds} Bedroom{roomDetails.beds !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Bathroom */}
                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
                  <Bath className="w-5 h-5 text-gray-500" />
                  <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                    {roomDetails.baths} Bathroom{roomDetails.baths !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Square Footage */}
                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 relative flex-[0_0_auto] rounded-full">
                  <Square className="w-5 h-5 text-gray-500" />
                  <div className="relative w-fit mt-[-1.00px] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                    {roomDetails.sqft} Sqft
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing & Lease Terms */}
      <Card className="w-full shadow-[0px_0px_5px_#00000029] rounded-xl">
        <CardContent className="flex flex-col gap-8 p-6">
          <div className="flex items-center justify-between w-full">
            <h2 className={sectionHeaderStyles}>
              Pricing & Lease Terms
            </h2>
            {editingSections['pricing'] ? renderEditButtons('pricing') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('pricing')} />}
          </div>

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


      {/* Amenities */}
      {(displayAmenities.length > 0 || editingSections['amenities']) && (
        <Card className="p-6 rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-8 p-0">
            <div className="flex items-center justify-between w-full">
              <h2 className={sectionHeaderStyles}>
                Amenities
              </h2>
              {editingSections['amenities'] ? renderEditButtons('amenities') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('amenities')} />}
            </div>

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
                            className={`cursor-pointer border-2 w-[85px] h-[96px] ${
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
                <div className="flex items-center gap-[60px] w-full flex-wrap gap-y-4">
                  {displayAmenities.map((amenity, index) => {
                    const IconComponent = amenity.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 py-1">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <IconComponent className={`w-5 h-5 ${labelStyles}`} />
                        </div>
                        <span className={valueStyles}>
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
        <Card className="w-full rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center justify-between w-full">
              <CardTitle className={sectionHeaderStyles}>
                Photos ({currentListing.listingImages.length})
              </CardTitle>
              {editingSections['photos'] ? renderEditButtons('photos') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('photos')} />}
            </div>
          </CardHeader>

          <CardContent className="px-6 py-8 flex justify-start">
            {editingSections['photos'] ? (
              <div className="w-full space-y-6">
                {/* Upload Section */}
                <div className="flex justify-center">
                  <UploadButton
                    endpoint="listingUploadPhotos"
                    config={{
                      mode: "auto"
                    }}
                    className="uploadthing-custom"
                    appearance={{
                      button: "border border-primaryBrand bg-background text-primaryBrand hover:bg-primaryBrand hover:text-white transition-all duration-300 h-[44px] min-w-[160px] rounded-lg px-[14px] py-[10px] gap-1 font-semibold text-base",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: ({ ready, isUploading }) => (
                        <div className="flex items-center justify-center gap-2">
                          {isUploading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          <span>{isUploading ? "Uploading..." : "Upload Photos"}</span>
                        </div>
                      ),
                    }}
                    onClientUploadComplete={handlePhotoUpload}
                    onUploadError={(error) => {
                      console.error("Upload error:", error);
                      toast({
                        title: "Upload Error",
                        description: error.message || "Failed to upload photos. Please try again.",
                        variant: "destructive"
                      });
                    }}
                  />
                </div>

                {/* Drag and Drop Photos */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">Drag photos to reorder or drop on trash to delete</p>
                  
                  {/* Trash Zone */}
                  <div
                    className={`w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                      dragOverTrash ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnterTrash}
                    onDragLeave={handleDragLeaveTrash}
                    onDrop={handleDropOnTrash}
                  >
                    <div className="flex items-center gap-2 text-gray-500">
                      <Trash2 className="w-5 h-5" />
                      <span>Drop here to delete</span>
                    </div>
                  </div>

                  {/* Photo Grid */}
                  <div 
                    className="flex flex-wrap gap-4 justify-start"
                    onDragLeave={handleDragLeave}
                  >
                    {(formData.listingImages || []).map((image, index) => (
                      <div key={image.id} className="relative">
                        {/* Drop Preview Indicator */}
                        {dropPreviewIndex === index && draggedImageId !== image.id && (
                          <div className="absolute -left-2 top-0 w-1 h-full bg-blue-500 rounded-full z-10" />
                        )}
                        
                        <div
                          className={`w-[175px] h-[108px] relative rounded-lg overflow-hidden cursor-grab border-2 transition-all ${
                            draggedImageId === image.id 
                              ? 'opacity-50 border-blue-400 scale-95' 
                              : dropPreviewIndex === index && draggedImageId !== image.id
                              ? 'border-blue-300 shadow-lg'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, image.id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <img
                            src={image.url}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* End Drop Zone */}
                    {draggedImageId && (
                      <div
                        className={`w-[175px] h-[108px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                          dropPreviewIndex === (formData.listingImages?.length || 0) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300'
                        }`}
                        onDragOver={(e) => handleDragOver(e, formData.listingImages?.length || 0)}
                        onDrop={(e) => handleDrop(e, formData.listingImages?.length || 0)}
                      >
                        <span className="text-gray-500 text-sm">Drop here</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-start">
                {currentListing.listingImages.map((image, index) => (
                  <div key={index} className="w-[175px] h-[108px] relative rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default SummaryTab;

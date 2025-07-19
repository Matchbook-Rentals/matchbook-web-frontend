"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { useListingDashboard } from '../listing-dashboard-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTrigger } from '@/components/brandDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, MapPin, DollarSign, Calendar, User, Bed, Bath, Square, Wifi, Car, Heart, Users, Building, PawPrint, Edit, Check, X, Plus, Minus, Loader2, PencilIcon, Trash2, Upload } from 'lucide-react';
import Tile from '@/components/ui/tile';
import { ListingCreationCard } from '@/app/app/host/add-property/listing-creation-card';
import { ListingCreationCounter } from '@/app/app/host/add-property/listing-creation-counter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateListing, updateListingPhotos, updateListingLocation, updateListingMonthlyPricing, getListingWithPricing } from '@/app/actions/listings';
import { revalidateListingCache } from '@/app/app/host/_actions';
import { toast } from '@/components/ui/use-toast';
import { PropertyType } from '@/constants/enums';
import * as AmenitiesIcons from '@/components/icons/amenities';
import InComplexIcon from '@/lib/icons/in-complex';
import NotAvailableIcon from '@/lib/icons/not-available';
import { iconAmenities } from '@/lib/amenities-list';
import { useUploadThing } from "@/app/utils/uploadthing";
import { Progress } from "@/components/ui/progress";
import { BrandButton } from "@/components/ui/brandButton";

// Amenity options grouped by category (same as listing creation)
const AMENITY_GROUPS = [
  {
    group: 'Accessibility & Safety',
    items: [
      { value: 'wheelchairAccess', label: 'Accessible', icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-1 mt-0" /> },
      { value: 'fencedInYard', label: 'Fenced Yard', icon: <AmenitiesIcons.UpdatedFencedYardIcon className="p-1 mt-0" /> },
      { value: 'keylessEntry', label: 'Keyless Entry', icon: <AmenitiesIcons.UpdatedKeylessEntryIcon className="p-1 mt-0" /> },
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
    group: 'Parking',
    items: [
      { value: 'offStreetParking', label: 'Off Street Parking', icon: <AmenitiesIcons.UpdatedParkingIcon className="p-1 mt-0" /> },
      { value: 'evCharging', label: 'EV Charging', icon: <AmenitiesIcons.UpdatedEvChargingIcon className="p-1 mt-0 ml-0" /> },
      { value: 'garageParking', label: 'Garage Parking', icon: <AmenitiesIcons.UpdatedGarageIcon className="p-1 mt-0" /> },
    ]
  },
  {
    group: 'Kitchen',
    items: [
      { value: 'garbageDisposal', label: 'Garbage Disposal', icon: <AmenitiesIcons.UpdatedGarbageDisposalIcon className="p-1 my-0" /> },
      { value: 'dishwasher', label: 'Dishwasher', icon: <AmenitiesIcons.UpdatedDishwasherIcon className="p-1 mt-0" /> },
      { value: 'fridge', label: 'Refrigerator', icon: <AmenitiesIcons.UpdatedFridgeIcon className="p-1 mt-0 " /> },
      { value: 'oven', label: 'Oven/Stove', icon: <AmenitiesIcons.UpdatedOvenIcon className="p-1 mt-0" /> },
      { value: 'grill', label: 'Grill', icon: <AmenitiesIcons.UpdatedGrillIcon className="p-1" /> },
      { value: 'kitchenEssentials', label: 'Kitchen Essentials', icon: <AmenitiesIcons.UpdatedKitchenEssentialsIcon className="p-1 mt-0" /> },
    ]
  },
  {
    group: 'Climate Control & Workspace',
    items: [
      { value: 'fireplace', label: 'Fireplace', icon: <AmenitiesIcons.UpdatedFireplaceIcon className="p-1 mt-0" /> },
      { value: 'heater', label: 'Heater', icon: <AmenitiesIcons.UpdatedHeaterIcon className="p-1 mt-0" /> },
      { value: 'dedicatedWorkspace', label: 'Workspace', icon: <AmenitiesIcons.UpdatedDedicatedWorkspaceIcon className="p-1 mt-0" /> },
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
      { value: 'sunroom', label: 'Sunroom', icon: <AmenitiesIcons.UpdatedSunroomIcon className="p-1 mt-0" /> },
    ]
  },
];

interface LeaseTermPricing {
  months: number;
  price: string;
  utilitiesIncluded: boolean;
}

interface UploadProgress {
  totalFiles: number;
  uploadedFiles: number;
  currentBatch: number;
  totalBatches: number;
  isUploading: boolean;
  errors: string[];
}

interface SummaryTabProps {
  listing: ListingAndImages;
  onListingUpdate?: (updatedListing: ListingAndImages) => void;
}

const BATCH_SIZE = 5; // Upload 5 files at a time
const MAX_PHOTOS = 30;

const SummaryTab: React.FC<SummaryTabProps> = ({ listing, onListingUpdate }) => {
  const { updateListing: updateContextListing } = useListingDashboard();
  const router = useRouter();
  
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
  const [showLocationConfirmDialog, setShowLocationConfirmDialog] = useState(false);
  const [pendingLocationUpdate, setPendingLocationUpdate] = useState<any>(null);
  const [showLocationBrandDialog, setShowLocationBrandDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    totalFiles: 0,
    uploadedFiles: 0,
    currentBatch: 0,
    totalBatches: 0,
    isUploading: false,
    errors: []
  });
  
  // Lease terms state - prioritizes monthlyPricing data over legacy price fields
  const [leaseTerms, setLeaseTerms] = useState<LeaseTermPricing[]>(() => {
    const terms: LeaseTermPricing[] = [];
    
    // Priority 1: Use monthlyPricing data (the source of truth for pricing)
    if (currentListing.monthlyPricing && currentListing.monthlyPricing.length > 0) {
      const sortedPricing = [...currentListing.monthlyPricing].sort((a, b) => a.months - b.months);
      const minMonths = sortedPricing[0].months;
      const maxMonths = sortedPricing[sortedPricing.length - 1].months;
      
      // Create terms for the full range, filling in prices where available
      for (let i = minMonths; i <= maxMonths; i++) {
        const pricingData = sortedPricing.find(p => p.months === i);
        terms.push({ 
          months: i, 
          price: pricingData ? pricingData.price.toString() : '', 
          utilitiesIncluded: pricingData ? pricingData.utilitiesIncluded || false : false 
        });
      }
    } else {
      // Fallback when no monthlyPricing data exists - create empty terms for the lease range
      // No longer using legacy shortestLeasePrice/longestLeasePrice to avoid data inconsistency
      const shortest = currentListing.shortestLeaseLength || 1;
      const longest = currentListing.longestLeaseLength || 12;
      
      for (let i = shortest; i <= longest; i++) {
        // Create empty pricing terms - user will need to fill in prices
        terms.push({ months: i, price: '', utilitiesIncluded: false });
      }
    }
    
    return terms;
  });

  const { startUpload } = useUploadThing("listingUploadPhotos", {
    onClientUploadComplete: (res) => {
      // This is called after each batch completes
      if (Array.isArray(res) && res.length > 0) {
        const newPhotos = res.map((file) => ({
          id: file.key || null,
          url: file.url || null,
          listingId: null,
          category: null,
          rank: null,
        }));
        
        const currentImages = formData.listingImages || [];
        updateFormData('listingImages', [...currentImages, ...newPhotos]);
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles + res.length
        }));
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setUploadProgress(prev => ({
        ...prev,
        errors: [...prev.errors, error.message || "Upload failed"]
      }));
    }
  });

  // Define which fields belong to each section
  const sectionFields: Record<string, string[]> = {
    basic: ['category', 'furnished', 'title', 'petsAllowed'],
    location: ['streetAddress1', 'streetAddress2', 'city', 'state', 'postalCode'],
    details: ['roomCount', 'bathroomCount', 'squareFootage'],
    pricing: ['shortestLeasePrice', 'longestLeasePrice', 'shortestLeaseLength', 'longestLeaseLength', 'depositSize', 'rentDueAtBooking', 'petDeposit', 'petRent'],
    amenities: ['wheelchairAccess', 'fencedInYard', 'keylessEntry', 'alarmSystem', 'gatedEntry', 'smokeDetector', 'carbonMonoxide', 'security', 'mountainView', 'cityView', 'waterfront', 'waterView', 'offStreetParking', 'evCharging', 'garageParking', 'garbageDisposal', 'dishwasher', 'fridge', 'oven', 'grill', 'kitchenEssentials', 'fireplace', 'heater', 'dedicatedWorkspace', 'airConditioner', 'gym', 'sauna', 'balcony', 'pool', 'hotTub', 'patio', 'sunroom', 'washerInUnit', 'washerInComplex', 'washerNotAvailable'],
    // Note: petRent and petSecurityDeposit are not yet in the database schema and should not be sent to server
    description: ['description'],
    photos: [] // Photos are handled separately since they're a relation
  };

  // Lease terms management functions
  const updateLeaseTermRange = (newShortestStay: number, newLongestStay: number) => {
    const newTerms: LeaseTermPricing[] = [];
    for (let i = newShortestStay; i <= newLongestStay; i++) {
      const existing = leaseTerms.find(t => t.months === i);
      if (existing) {
        newTerms.push(existing);
      } else {
        newTerms.push({ months: i, price: '', utilitiesIncluded: false });
      }
    }
    setLeaseTerms(newTerms);
  };

  const updateLeaseTermPrice = (months: number, price: string) => {
    const updated = leaseTerms.map(t => 
      t.months === months ? { ...t, price } : t
    );
    setLeaseTerms(updated);
  };

  const updateLeaseTermUtilities = (months: number, utilitiesIncluded: boolean) => {
    // Check if all checkboxes are currently unchecked (false)
    const allUnchecked = leaseTerms.every(t => !t.utilitiesIncluded);
    
    if (allUnchecked && utilitiesIncluded) {
      // First click when all are unchecked - check all months up to and including the clicked month
      const updated = leaseTerms.map(t => ({
        ...t,
        utilitiesIncluded: t.months <= months
      }));
      setLeaseTerms(updated);
    } else {
      // Normal behavior - just toggle the clicked checkbox
      const updated = leaseTerms.map(t => 
        t.months === months ? { ...t, utilitiesIncluded } : t
      );
      setLeaseTerms(updated);
    }
  };

  const handleLeaseTermsChange = () => {
    const updatedFormData = { ...formData };
    
    // Find the shortest and longest terms with prices
    const termsWithPrices = leaseTerms.filter(t => t.price && parseFloat(t.price) > 0);
    
    if (termsWithPrices.length > 0) {
      const sortedTerms = termsWithPrices.sort((a, b) => a.months - b.months);
      const shortestTerm = sortedTerms[0];
      const longestTerm = sortedTerms[sortedTerms.length - 1];
      
      updatedFormData.shortestLeaseLength = shortestTerm.months;
      updatedFormData.shortestLeasePrice = parseFloat(shortestTerm.price);
      updatedFormData.longestLeaseLength = longestTerm.months;
      updatedFormData.longestLeasePrice = parseFloat(longestTerm.price);
    }
    
    setFormData(updatedFormData);
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
    
    if (section === 'pricing') {
      // Check both regular pricing fields and lease terms
      const fields = sectionFields[section] || [];
      const regularChanges = fields.some(field => {
        const currentValue = formData[field as keyof typeof formData];
        const originalValue = currentListing[field as keyof typeof currentListing];
        
        // Handle different types of comparisons
        if (currentValue === undefined && originalValue === undefined) return false;
        if (currentValue === null && originalValue === null) return false;
        if (currentValue === '' && (originalValue === null || originalValue === undefined)) return false;
        
        return currentValue !== originalValue;
      });
      
      // Check if lease terms have changed from original
      const originalShortestLength = currentListing.shortestLeaseLength || 1;
      const originalLongestLength = currentListing.longestLeaseLength || 12;
      const originalTerms: LeaseTermPricing[] = [];
      
      for (let i = originalShortestLength; i <= originalLongestLength; i++) {
        let price = '';
        if (i === originalShortestLength && currentListing.shortestLeasePrice) {
          price = currentListing.shortestLeasePrice.toString();
        } else if (i === originalLongestLength && currentListing.longestLeasePrice) {
          price = currentListing.longestLeasePrice.toString();
        }
        originalTerms.push({ months: i, price, utilitiesIncluded: false });
      }
      
      const leaseTermsChanged = JSON.stringify(leaseTerms) !== JSON.stringify(originalTerms);
      
      return regularChanges || leaseTermsChanged;
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
    if (section === 'photos') {
      const photoCount = (formData.listingImages || []).filter(photo => photo.url).length;
      return photoCount >= 4;
    }
    if (section === 'pricing') {
      // ALL monthly rent fields must be filled in with values > 0
      const allFieldsValid = leaseTerms.every(t => {
        if (!t.price || t.price.trim() === '' || t.price.trim() === '0') return false;
        const price = parseFloat(t.price);
        return !isNaN(price) && price > 0;
      });
      
      // Rent due at booking validation
      const rentDueAtBookingValid = isRentDueAtBookingValid();
      
      return allFieldsValid && rentDueAtBookingValid;
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
      
      // Reset lease terms if editing pricing section
      if (section === 'pricing') {
        const terms: LeaseTermPricing[] = [];
        
        // Use same logic as initialization
        if (currentListing.monthlyPricing && currentListing.monthlyPricing.length > 0) {
          const sortedPricing = [...currentListing.monthlyPricing].sort((a, b) => a.months - b.months);
          const minMonths = sortedPricing[0].months;
          const maxMonths = sortedPricing[sortedPricing.length - 1].months;
          
          for (let i = minMonths; i <= maxMonths; i++) {
            const pricingData = sortedPricing.find(p => p.months === i);
            terms.push({ 
              months: i, 
              price: pricingData ? pricingData.price.toString() : '', 
              utilitiesIncluded: pricingData ? pricingData.utilitiesIncluded || false : false 
            });
          }
        } else {
          const shortest = currentListing.shortestLeaseLength || 1;
          const longest = currentListing.longestLeaseLength || 12;
          
          for (let i = shortest; i <= longest; i++) {
            let price = '';
            if (i === shortest && currentListing.shortestLeasePrice) {
              price = currentListing.shortestLeasePrice.toString();
            } else if (i === longest && currentListing.longestLeasePrice) {
              price = currentListing.longestLeasePrice.toString();
            }
            terms.push({ months: i, price, utilitiesIncluded: false });
          }
        }
        setLeaseTerms(terms);
      }
    }
  };

  // Cancel editing
  const cancelEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false
    }));
    setFormData(currentListing); // Reset to current saved data
    
    // Reset lease terms if cancelling pricing section
    if (section === 'pricing') {
      const terms: LeaseTermPricing[] = [];
      
      // Use same logic as initialization
      if (currentListing.monthlyPricing && currentListing.monthlyPricing.length > 0) {
        const sortedPricing = [...currentListing.monthlyPricing].sort((a, b) => a.months - b.months);
        const minMonths = sortedPricing[0].months;
        const maxMonths = sortedPricing[sortedPricing.length - 1].months;
        
        for (let i = minMonths; i <= maxMonths; i++) {
          const pricingData = sortedPricing.find(p => p.months === i);
          terms.push({ 
            months: i, 
            price: pricingData ? pricingData.price.toString() : '', 
            utilitiesIncluded: pricingData ? pricingData.utilitiesIncluded || false : false 
          });
        }
      } else {
        const shortest = currentListing.shortestLeaseLength || 1;
        const longest = currentListing.longestLeaseLength || 12;
        
        for (let i = shortest; i <= longest; i++) {
          let price = '';
          if (i === shortest && currentListing.shortestLeasePrice) {
            price = currentListing.shortestLeasePrice.toString();
          } else if (i === longest && currentListing.longestLeasePrice) {
            price = currentListing.longestLeasePrice.toString();
          }
          terms.push({ months: i, price, utilitiesIncluded: false });
        }
      }
      setLeaseTerms(terms);
    }
  };

  // Handle location update through brand dialog
  const handleLocationUpdate = async () => {
    try {
      const locationFields = sectionFields['location'] || [];
      const locationData: any = {};
      
      locationFields.forEach(field => {
        const currentValue = formData[field as keyof typeof formData];
        locationData[field] = currentValue;
      });

      console.log('Updating location with data:', locationData);
      const updatedListing = await updateListingLocation(listing.id, locationData);
      
      // Invalidate listing cache
      await revalidateListingCache(listing.id);
      
      // Update the current listing with the new data
      setCurrentListing(updatedListing);
      setFormData(updatedListing);
      
      // Update the context with the new listing data
      updateContextListing(updatedListing);
      
      // Call the optional callback to update parent component
      if (onListingUpdate) {
        onListingUpdate(updatedListing);
      }

      // Exit edit mode
      setEditingSections(prev => ({
        ...prev,
        location: false
      }));

      // Show success message
      toast({
        title: "Location Updated",
        description: "Your listing location has been updated and is now pending review. During the review period, your listing will not be shown to renters.",
        variant: "success"
      });

    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save changes
  const saveChanges = async (section: string) => {
    setIsSaving(true);
    setButtonStates(prev => ({ ...prev, [section]: 'saving' }));
    
    try {
      if (section === 'pricing') {
        // Update form data with lease terms before saving
        handleLeaseTermsChange();
        
        // Get the updated form data after lease terms processing
        const updatedFormData = { ...formData };
        const termsWithPrices = leaseTerms.filter(t => t.price && parseFloat(t.price) > 0);
        
        // Validation: Check if rent due at booking exceeds smallest monthly rent
        if (termsWithPrices.length > 0 && updatedFormData.rentDueAtBooking) {
          const allPrices = termsWithPrices.map(t => parseFloat(t.price));
          const smallestRent = Math.min(...allPrices);
          
          if (updatedFormData.rentDueAtBooking > smallestRent) {
            throw new Error(`Rent due at booking ($${updatedFormData.rentDueAtBooking.toLocaleString()}) cannot exceed the smallest monthly rent ($${smallestRent.toLocaleString()})`);
          }
        }
        
        if (termsWithPrices.length > 0) {
          const sortedTerms = termsWithPrices.sort((a, b) => a.months - b.months);
          const shortestTerm = sortedTerms[0];
          const longestTerm = sortedTerms[sortedTerms.length - 1];
          
          // Schema alignment: Listing table basic pricing fields
          // Only save the lease length metadata - prices are now derived from monthlyPricing table
          updatedFormData.shortestLeaseLength = shortestTerm.months;  // Schema: shortestLeaseLength (Int) - minimum lease length in months
          updatedFormData.longestLeaseLength = longestTerm.months;   // Schema: longestLeaseLength (Int) - maximum lease length in months
          
          // NOTE: shortestLeasePrice and longestLeasePrice are no longer saved to main Listing table
          // These values are now derived from the ListingMonthlyPricing table to maintain data consistency
        }
        
        // Handle regular pricing fields for Listing table
        // Schema alignment: All pricing fields from the Listing model
        // - depositSize: Int? @default(0) - security deposit amount
        // - petDeposit: Int? @default(0) - pet security deposit
        // - petRent: Int? @default(0) - monthly pet rent per pet
        // - reservationDeposit: Int? @default(0) - reservation deposit
        // - rentDueAtBooking: Int? @default(0) - rent due at booking
        // - shortestLeaseLength: Int @default(1) - minimum lease length in months
        // - longestLeaseLength: Int @default(12) - maximum lease length in months
        // - utilitiesIncluded: Boolean @default(false) - utilities included flag
        // NOTE: shortestLeasePrice and longestLeasePrice are NO LONGER SAVED - derived from monthlyPricing table
        const fields = sectionFields[section] || [];
        const updateData: any = {};
        
        fields.forEach(field => {
          const currentValue = updatedFormData[field as keyof typeof updatedFormData];
          const originalValue = currentListing[field as keyof typeof currentListing];
          
          // Only include fields that have changed
          if (currentValue !== originalValue) {
            updateData[field] = currentValue;
          }
        });
        
        // Save basic pricing fields to Listing table
        if (Object.keys(updateData).length > 0) {
          console.log(`Saving section '${section}' with data:`, updateData);
          await updateListing(listing.id, updateData);
        }
        
        // Save detailed monthly pricing to ListingMonthlyPricing table
        if (termsWithPrices.length > 0) {
          const monthlyPricingData = termsWithPrices.map(term => ({
            months: term.months,                    // Schema: months (Int) - Number of months (1-12)
            price: Math.round(parseFloat(term.price)), // Schema: price (Int) - Price for this month length
            utilitiesIncluded: term.utilitiesIncluded  // Schema: utilitiesIncluded (Boolean) - Whether utilities are included
          }));
          
          console.log('Saving monthly pricing data:', monthlyPricingData);
          await updateListingMonthlyPricing(listing.id, monthlyPricingData);
        }
        
        // Invalidate listing cache after pricing updates
        if (Object.keys(updateData).length > 0 || termsWithPrices.length > 0) {
          await revalidateListingCache(listing.id);
        }
        
        // Fetch the complete updated listing with monthly pricing
        const updatedListingWithPricing = await getListingWithPricing(listing.id);
        
        if (updatedListingWithPricing) {
          // Update the current listing with the new data
          const updatedListing = { ...currentListing, ...updateData, monthlyPricing: updatedListingWithPricing.monthlyPricing };
          setCurrentListing(updatedListing);
          setFormData(updatedListing);
          
          // Reset lease terms with the actual saved data instead of losing user input
          // This preserves all monthly pricing data that was saved
          const newTerms: LeaseTermPricing[] = [];
          const shortest = updatedListing.shortestLeaseLength || 1;
          const longest = updatedListing.longestLeaseLength || 12;
          
          for (let i = shortest; i <= longest; i++) {
            // Find the saved monthly pricing data for this month
            const savedPricing = updatedListingWithPricing.monthlyPricing?.find(p => p.months === i);
            
            newTerms.push({ 
              months: i, 
              price: savedPricing ? savedPricing.price.toString() : '', // Use saved price or empty string
              utilitiesIncluded: savedPricing ? savedPricing.utilitiesIncluded : false // Use saved utilities flag
            });
          }
          setLeaseTerms(newTerms);
          
          // Update the context with the new listing data
          updateContextListing(updatedListing);
          
          // Call the optional callback to update parent component
          if (onListingUpdate) {
            onListingUpdate(updatedListing);
          }
        } else {
          console.log(`No changes detected for section '${section}'`);
        }
        
      } else if (section === 'photos') {
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
          // Invalidate listing cache after photo updates
          await revalidateListingCache(listing.id);
          
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
      } else if (section === 'location') {
        // Handle location fields with special server action
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
          console.log(`Saving location section with data:`, updateData);
          const updatedListing = await updateListingLocation(listing.id, updateData);
          
          // Invalidate listing cache after location updates
          await revalidateListingCache(listing.id);
          
          // Update the current listing with the new data
          setCurrentListing(updatedListing);
          
          // Update the context with the new listing data
          updateContextListing(updatedListing);
          
          // Call the optional callback to update parent component
          if (onListingUpdate) {
            onListingUpdate(updatedListing);
          }

          // Show success state briefly before refresh
          setButtonStates(prev => ({ ...prev, [section]: 'success' }));
          
          // Wait a moment to show success, then soft refresh and reset edit mode
          setTimeout(() => {
            router.refresh();
            setEditingSections(prev => ({
              ...prev,
              [section]: false
            }));
            setButtonStates(prev => ({ ...prev, [section]: null }));
          }, 300);
          
          return; // Exit early to prevent normal success flow
        } else {
          console.log(`No changes detected for location section`);
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
          
          // Invalidate listing cache after general updates
          await revalidateListingCache(listing.id);
          
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
              ${buttonState === 'success' ? 'bg-secondaryBrand hover:bg-secondaryBrand text-white' : 
                buttonState === 'failed' ? 'bg-red-600 hover:bg-red-600' : 
                !canSave && !buttonState ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' : 
                canSave && !buttonState ? 'bg-secondaryBrand hover:bg-secondaryBrand/90 text-white' : ''}
            `}
            onClick={() => !buttonState && canSave && saveChanges(section)}
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

  // Helper function to check if rent due at booking exceeds smallest monthly rent
  const isRentDueAtBookingValid = () => {
    const termsWithPrices = leaseTerms.filter(t => t.price && parseFloat(t.price) > 0);
    
    if (termsWithPrices.length === 0 || !formData.rentDueAtBooking) {
      return true; // No validation needed if no prices or no rent due at booking
    }
    
    const allPrices = termsWithPrices.map(t => parseFloat(t.price));
    const smallestRent = Math.min(...allPrices);
    
    return formData.rentDueAtBooking <= smallestRent;
  };

  // Format price range - now derived from monthlyPricing data for consistency
  const formatPriceRange = () => {
    // Get pricing data from monthlyPricing table instead of legacy shortestLeasePrice/longestLeasePrice
    const monthlyPricing = currentListing.monthlyPricing || [];
    
    if (monthlyPricing.length === 0) {
      return 'Price not set';
    }
    
    // Find the actual minimum and maximum prices across all months
    const allPrices = monthlyPricing.map(p => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toLocaleString()}`;
    }
    
    return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
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

  // Laundry options (aligned with Prisma schema)
  const laundryOptions = [
    {
      value: 'washerInUnit',
      label: 'In Unit',
      id: 'inUnit',
    },
    {
      value: 'washerInComplex',
      label: 'In Complex',
      id: 'inComplex',
    },
    {
      value: 'washerNotAvailable',
      label: 'Unavailable',
      id: 'unavailable',
    },
  ];

  // Helper to check which laundry option is selected
  const getLaundrySelection = () => {
    if ((formData as any).washerInUnit) return 'washerInUnit';
    if ((formData as any).washerInComplex) return 'washerInComplex';
    if ((formData as any).washerNotAvailable) return 'washerNotAvailable';
    return '';
  };

  // Helper for laundry radio selection
  const handleLaundryChange = (value: string) => {
    // Remove all existing laundry options first
    const laundryValues = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
    laundryValues.forEach(laundryValue => {
      updateFormData(laundryValue, false);
    });
    
    // Add the new laundry option
    updateFormData(value, true);
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityValue: string) => {
    // Check if this is a laundry option
    const laundryValues = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
    
    if (laundryValues.includes(amenityValue)) {
      // Handle laundry options with radio behavior
      if ((formData as any)[amenityValue]) {
        // If already selected, deselect it
        updateFormData(amenityValue, false);
      } else {
        // If not selected, select it and deselect others
        handleLaundryChange(amenityValue);
      }
    } else {
      // Handle regular amenities with toggle behavior
      const currentValue = (formData as any)[amenityValue];
      updateFormData(amenityValue, !currentValue);
    }
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

  // Client-side file validation
  const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    
    // Check total file count including existing photos
    const currentPhotoCount = (formData.listingImages || []).filter(photo => photo.url).length;
    const totalCount = currentPhotoCount + files.length;
    
    if (totalCount > MAX_PHOTOS) {
      errors.push(`You can only have up to ${MAX_PHOTOS} photos total. You currently have ${currentPhotoCount} photos and are trying to add ${files.length} more.`);
      return { valid: false, errors };
    }
    
    // Check each file
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
        errors.push(`File "${file.name}" has unsupported type "${fileExtension}". Please use JPG, JPEG, PNG, SVG, or WEBP files only.`);
      }
      
      if (file.name.length > 255) {
        errors.push(`File "${file.name}" has a name that's too long. Please use a shorter filename.`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  // Smart distribution: larger files go to later batches for better UX
  const createBatches = (files: File[], batchSize: number): File[][] => {
    if (files.length === 0) return [];
    
    // Calculate number of batches needed
    const numBatches = Math.ceil(files.length / batchSize);
    const batches: File[][] = Array.from({ length: numBatches }, () => []);
    
    // Sort files by size (largest first) for smart distribution
    const sortedFiles = [...files].sort((a, b) => b.size - a.size);
    
    // Distribute files round-robin starting from the last batch (back-loading)
    // This puts largest files in later batches for better user psychology
    sortedFiles.forEach((file, index) => {
      const batchIndex = (numBatches - 1) - (index % numBatches);
      batches[batchIndex].push(file);
    });
    
    return batches;
  };

  // Handle file selection and batch upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Validate files
    const validation = validateFiles(files);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast({
          title: "Upload Error",
          description: error,
          variant: "destructive"
        });
      });
      return;
    }
    
    // Create batches
    const batches = createBatches(files, BATCH_SIZE);
    
    // Initialize progress
    setUploadProgress({
      totalFiles: files.length,
      uploadedFiles: 0,
      currentBatch: 0,
      totalBatches: batches.length,
      isUploading: true,
      errors: []
    });
    
    // Upload batches sequentially
    let successCount = 0;
    let resizedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      setUploadProgress(prev => ({
        ...prev,
        currentBatch: i + 1
      }));
      
      try {
        const result = await startUpload(batches[i]);
        if (result && result.length > 0) {
          successCount += result.length;
          resizedCount += result.filter(f => f.wasResized).length;
        }
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        setUploadProgress(prev => ({
          ...prev,
          errors: [...prev.errors, `Some photos failed to upload. Please try again.`]
        }));
      }
    }
    
    // Upload complete
    setUploadProgress(prev => ({
      ...prev,
      isUploading: false
    }));
    
    // Show completion message
    if (successCount > 0) {
      let description = `Successfully uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}.`;
      if (resizedCount > 0) {
        description += ` ${resizedCount} photo${resizedCount !== 1 ? 's were' : ' was'} automatically resized to optimize size.`;
      }
      toast({
        title: "Photos Uploaded!",
        description,
        variant: "default"
      });
    }
    
    // Show any errors
    if (uploadProgress.errors.length > 0) {
      uploadProgress.errors.forEach((error) => {
        toast({
          title: "Upload Warning",
          description: error,
          variant: "destructive"
        });
      });
    }
    
    // Reset file input
    const fileInput = event.target;
    if (fileInput) {
      fileInput.value = '';
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
      id: "rent-due-at-booking",
      label: "Rent Due at Booking",
      value: currentListing.rentDueAtBooking ? `$${currentListing.rentDueAtBooking.toLocaleString()}` : 'Not specified',
      width: "w-full sm:w-[320px]",
      valueStyle: "font-text-label-medium-medium",
    },
    {
      id: "pet-deposit",
      label: "Pet Deposit",
      value: currentListing.petDeposit ? `$${currentListing.petDeposit.toLocaleString()}` : (currentListing.petsAllowed ? "Not Specified" : "No Pets"),
      width: "w-full sm:w-[235px]",
      valueStyle: "font-text-label-medium-medium",
    },
    {
      id: "pet-rent",
      label: "Pet Rent (Per Pet)",
      value: currentListing.petRent ? `$${currentListing.petRent.toLocaleString()}/month` : (currentListing.petsAllowed ? "Not Specified" : "No Pets"),
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
    <div className="space-y-6 p-0 ">

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
          <CardContent className="flex flex-wrap items-start gap-6 p-0">
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
            <div className="flex  flex-col gap-[18px] w-full">
              <label className="text-sm font-medium break-words text-gray-700 break-words max-w-[80%]">Property Description</label>
              <Textarea
                value={formData.description + '' || ''}
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
              <p className={`${noLabelStyles} whitespace-pre-wrap w-full pr-[2%] break-all overflow-hidden`} style={{ overflowWrap: 'anywhere', wordBreak: 'break-all', hyphens: 'auto' }}>
                {currentListing.description || 'No description provided.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location and Property Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Location */}
        <Card className="shadow-[0px_0px_5px_#00000029] p-0 lg:min-h-[140px]">
          <CardContent className="flex flex-col items-end gap-[18px] p-6">
            <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
              <div className="relative flex-1 opacity-90 text-2xl font-semibold text-gray-900">
                Location
              </div>
              {editingSections['location'] ? renderEditButtons('location') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => setShowLocationBrandDialog(true)} />}
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
        <Card className="shadow-[0px_0px_5px_#00000029] p-0 lg:min-h-[140px]">
          <CardContent className="flex flex-col items-end gap-[18px] p-6">
            <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
              <div className="flex-1 opacity-90 text-2xl font-semibold text-gray-900 relative mt-[-1.00px]">
                Property Details
              </div>
              {editingSections['details'] ? renderEditButtons('details') : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => toggleEdit('details')} />}
            </div>

            {editingSections['details'] ? (
              <div className="flex justify-between flex-wrap md:grid md:grid-cols-3 md:gap-4 w-full ">
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
                <div className="text-center w-auto min-w-0 max-w-[calc(50%-16px)] ">
                  <label className="text-sm font-medium text-gray-700">Square Feet</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.squareFootage || ''}
                    onChange={(e) => updateFormData('squareFootage', parseInt(e.target.value) || null)}
                    className="mt-1 "
                    placeholder="Square footage"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-[41px] relative self-stretch w-full flex-[0_0_auto]">
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
            <div className="space-y-6">
              {/* Form Inputs on Top */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sidebar rounded-lg p-4 shadow-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.depositSize || ''}
                    onChange={(e) => updateFormData('depositSize', parseInt(e.target.value) || null)}
                    className="mt-1"
                    placeholder="Security deposit amount"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Rent Due at Booking</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.rentDueAtBooking || ''}
                    onChange={(e) => updateFormData('rentDueAtBooking', parseInt(e.target.value) || null)}
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
                    type="number"
                    min="0"
                    value={formData.petDeposit || ''}
                    onChange={(e) => updateFormData('petDeposit', parseInt(e.target.value) || null)}
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
                    onChange={(e) => updateFormData('petRent', parseInt(e.target.value) || null)}
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
                      containerClassName='min-w-[200px]'
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
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                updateLeaseTermPrice(term.months, value);
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
              <div className="flex flex-col gap-0">
                  {/* Laundry Section - Badges (mobile only) */}
                  <div className="md:hidden space-y-4 pt-0 pb-10 mb-0">
                    <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
                    <div className="flex flex-wrap gap-4">
                      {laundryOptions.map((option) => (
                        <Badge
                          key={option.id}
                          variant="outline"
                          className={`inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                            getLaundrySelection() === option.value
                              ? 'bg-gray-100 border-[#4f4f4f] border-2'
                              : 'bg-gray-50 border-[#d9dadf]'
                          }`}
                          onClick={() => handleLaundryChange(option.value)}
                        >
                          {React.cloneElement(
                            option.value === 'washerInComplex' ? <InComplexIcon className="w-4 h-4" /> : 
                            option.value === 'washerNotAvailable' ? <NotAvailableIcon className="w-4 h-4" /> :
                            <AmenitiesIcons.WasherIcon className="w-4 h-4" />,
                            { className: "w-4 h-4" }
                          )}
                          <span className="font-['Poppins',Helvetica] font-medium text-sm text-center leading-5 text-[#344054]">
                            {option.label}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Laundry Section - Cards (medium and above) */}
                  <div className="hidden sm:block space-y-4 pt-0 pb-10 mb-0">
                    <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
                    <div className="flex flex-wrap gap-4">
                      {laundryOptions.map((option) => (
                        <ListingCreationCard
                          key={option.id}
                          name={option.label}
                          icon={
                            option.value === 'washerInComplex' ? <InComplexIcon className="w-8 h-8" /> : 
                            option.value === 'washerNotAvailable' ? <NotAvailableIcon className="w-8 h-8" /> :
                            <AmenitiesIcons.WasherIcon className="w-8 h-8" />
                          }
                          isSelected={getLaundrySelection() === option.value}
                          onClick={() => handleLaundryChange(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {AMENITY_GROUPS.map((group) => (
                    <div key={group.group} className="space-y-4 pt-0 pb-10 mb-0">
                      <h3 className="text-[18px] font-medium text-[#404040]">{group.group}</h3>
                      <div className="flex flex-wrap gap-4">
                        {group.items.map((amenity) => (
                          <React.Fragment key={amenity.value}>
                            {/* Badge for mobile (< md) */}
                            <Badge
                              variant="outline"
                              className={`md:hidden inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full border-solid cursor-pointer ${
                                (formData as any)[amenity.value]
                                  ? 'bg-gray-100 border-[#4f4f4f] border-2'
                                  : 'bg-gray-50 border-[#d9dadf]'
                              }`}
                              onClick={() => toggleAmenity(amenity.value)}
                            >
                              {React.cloneElement(amenity.icon as React.ReactElement, { 
                                className: "w-4 h-4" 
                              })}
                              <span className="font-['Poppins',Helvetica] font-medium text-sm text-center leading-5 text-[#344054]">
                                {amenity.label}
                              </span>
                            </Badge>
                            {/* Card for medium+ screens */}
                            <div className="hidden md:block">
                              <ListingCreationCard
                                name={amenity.label}
                                icon={amenity.icon}
                                isSelected={(formData as any)[amenity.value] || false}
                                onClick={() => toggleAmenity(amenity.value)}
                              />
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
              displayAmenities.length > 0 && (
                <div className="flex items-center gap-5 w-full flex-wrap">
                  {displayAmenities.map((amenity, index) => {
                    const IconComponent = amenity.icon;
                    return (
                      <Badge
                        key={index}
                        variant="outline"
                        className="inline-flex items-center justify-center gap-1.5 pl-1.5 pr-3 py-1 bg-gray-50 rounded-full border border-solid border-[#d9dadf]"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-['Poppins',Helvetica] font-medium text-[#344054] text-sm text-center leading-5">
                          {amenity.label}
                        </span>
                      </Badge>
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
                <div className="flex flex-col items-center gap-4">
                  {/* Upload progress display */}
                  {uploadProgress.isUploading && (
                    <div className="w-full max-w-md space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading photos...</span>
                        <span>{uploadProgress.uploadedFiles} of {uploadProgress.totalFiles} photos</span>
                      </div>
                      <Progress 
                        value={uploadProgress.totalFiles > 0 
                          ? Math.round((uploadProgress.uploadedFiles / uploadProgress.totalFiles) * 100)
                          : 0
                        } 
                        className="h-2" 
                      />
                      <p className="text-xs text-center text-gray-500">
                        Please wait while your photos are being uploaded...
                      </p>
                    </div>
                  )}

                  {/* Upload button */}
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                      onChange={handleFileSelect}
                      disabled={uploadProgress.isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <BrandButton
                      variant="outline"
                      disabled={uploadProgress.isUploading}
                      className="min-w-[160px] max-w-[280px]"
                    >
                      {uploadProgress.isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Click to upload
                        </>
                      )}
                    </BrandButton>
                  </div>
                  
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    SVG, PNG, WEBP, or JPG (max of 30 images, large files will be automatically resized)
                  </p>
                  
                  {/* Photo count validation - only show if below 4 photos */}
                  {(() => {
                    const photoCount = (formData.listingImages || []).filter(photo => photo.url).length;
                    if (photoCount < 4) {
                      return (
                        <div className="text-sm text-center">
                          <span className="text-red-600">
                            {4 - photoCount} more photo{4 - photoCount !== 1 ? 's' : ''} required (minimum 4)
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                          className={`w-[175px] h-[108px] relative rounded-lg overflow-hidden cursor-grab border-2 transition-all border-transparent ${
                            draggedImageId === image.id 
                              ? 'opacity-50 border-black scale-95' 
                              : dropPreviewIndex === index && draggedImageId !== image.id
                              ? 'border-blue-300 shadow-lg'
                              : 'hover:border-gray-300'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, image.id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <Image
                            src={image.url}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-full object-cover"
                            width={175}
                            height={108}
                          />
                          <div className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded font-medium border border-black">
                            {index < 4 ? 'Cover Photo' : index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Invisible placeholder that becomes drop zone when dragging */}
                    <div
                      className={`w-[175px] h-[108px] border-2 rounded-lg flex items-center justify-center transition-colors ${
                        draggedImageId
                          ? dropPreviewIndex === (formData.listingImages?.length || 0)
                            ? 'border-dashed border-blue-500 bg-blue-50'
                            : 'border-dashed border-gray-300'
                          : 'border-transparent'
                      }`}
                      onDragOver={(e) => handleDragOver(e, formData.listingImages?.length || 0)}
                      onDrop={(e) => handleDrop(e, formData.listingImages?.length || 0)}
                    >
                      {draggedImageId && (
                        <span className="text-gray-500 text-sm">Drop here</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-start">
                {currentListing.listingImages.map((image, index) => (
                  <div key={index} className="w-[175px] h-[108px] relative rounded-lg overflow-hidden">
                    <Image
                      src={image.url}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={175}
                      height={108}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Update Brand Dialog */}
      <Dialog open={showLocationBrandDialog} onOpenChange={setShowLocationBrandDialog}>
        <DialogContent className="max-w-[500px]">
          <div className="space-y-6 text-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Manual Review Required
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Any change to your listing&apos;s address will trigger a manual review process. During the 24-hour review period, your listing will not be shown to renters.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your listing will be hidden from search results</li>
                <li>• Our team will review your location update within 24 hours</li>
                <li>• You&apos;ll receive a notification once the review is complete</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowLocationBrandDialog(false)}
              className="flex-1 h-12 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLocationBrandDialog(false);
                toggleEdit('location');
              }}
              className="flex-1 h-12 rounded-lg bg-[#3c8787] hover:bg-[#2d6565] text-white"
            >
              Proceed to Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SummaryTab;

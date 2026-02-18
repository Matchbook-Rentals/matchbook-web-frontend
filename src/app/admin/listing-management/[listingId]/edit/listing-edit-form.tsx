'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BrandCheckbox } from '@/app/brandCheckbox'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Save, ArrowLeft, Loader2, MapPin, AlertCircle, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { updateListing, updateListingPricing } from '../../../listing-management-actions'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ListingEditFormProps {
  listing: any; // We'll use the ListingWithDetails type from the server actions
}

export default function ListingEditForm({ listing }: ListingEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    title: listing.title || '',
    description: listing.description || '',
    
    // Location
    locationString: listing.locationString || '',
    streetAddress1: listing.streetAddress1 || '',
    streetAddress2: listing.streetAddress2 || '',
    city: listing.city || '',
    state: listing.state || '',
    postalCode: listing.postalCode || '',
    latitude: listing.latitude || 0,
    longitude: listing.longitude || 0,
    
    // Property details
    roomCount: listing.roomCount || 1,
    bathroomCount: listing.bathroomCount || 1,
    squareFootage: listing.squareFootage || 0,
    category: listing.category || 'apartment',
    
    // Pricing
    depositSize: listing.depositSize || 0,
    petDeposit: listing.petDeposit || 0,
    petRent: listing.petRent || 0,
    rentDueAtBooking: listing.rentDueAtBooking || 0,
    shortestLeaseLength: listing.shortestLeaseLength || 1,
    longestLeaseLength: listing.longestLeaseLength || 12,
    
    // Features
    furnished: listing.furnished || false,
    petsAllowed: listing.petsAllowed || false,
    
    // Status
    markedActiveByUser: listing.markedActiveByUser || false,
    approvalStatus: listing.approvalStatus || 'pendingReview',
  })

  // Amenities state - dynamically build from listing
  const [amenities, setAmenities] = useState(() => {
    const amenityFields = [
      'airConditioner', 'laundryFacilities', 'fitnessCenter', 'elevator', 'wheelchairAccess',
      'doorman', 'parking', 'wifi', 'kitchen', 'dedicatedWorkspace', 'hairDryer', 'iron',
      'heater', 'hotTub', 'smokingAllowed', 'eventsAllowed', 'privateEntrance', 'security',
      'waterfront', 'beachfront', 'mountainView', 'cityView', 'waterView', 'washerInUnit',
      'washerHookup', 'washerNotAvailable', 'washerInComplex', 'dryerInUnit', 'dryerHookup',
      'dryerNotAvailable', 'dryerInComplex', 'offStreetParking', 'streetParking',
      'streetParkingFree', 'coveredParking', 'coveredParkingFree', 'uncoveredParking',
      'uncoveredParkingFree', 'garageParking', 'garageParkingFree', 'evCharging',
      'allowDogs', 'allowCats', 'gym', 'balcony', 'patio', 'sunroom', 'fireplace',
      'firepit', 'pool', 'sauna', 'jacuzzi', 'grill', 'oven', 'stove', 'wheelAccessible',
      'fencedInYard', 'secureLobby', 'keylessEntry', 'alarmSystem', 'storageShed',
      'gatedEntry', 'smokeDetector', 'carbonMonoxide', 'garbageDisposal', 'dishwasher',
      'fridge', 'tv', 'workstation', 'microwave', 'kitchenEssentials', 'linens', 'privateBathroom'
    ]
    
    return amenityFields.reduce((acc, field) => {
      acc[field] = listing[field] || false
      return acc
    }, {} as Record<string, boolean>)
  })

  // Monthly pricing state - initialize with default tiers if empty
  const [monthlyPricing, setMonthlyPricing] = useState(() => {
    if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
      return listing.monthlyPricing;
    }

    // Create default pricing tiers based on lease length range
    const shortestLease = listing.shortestLeaseLength || 1;
    const longestLease = listing.longestLeaseLength || 12;
    const defaultTiers = [];

    // Add common lease lengths within the range
    const commonLengths = [1, 3, 6, 9, 12, 18, 24];
    for (const months of commonLengths) {
      if (months >= shortestLease && months <= longestLease) {
        defaultTiers.push({
          months: months,
          price: 0,
          utilitiesIncluded: false
        });
      }
    }

    // Ensure we have at least the shortest lease length
    if (defaultTiers.length === 0 || !defaultTiers.find(t => t.months === shortestLease)) {
      defaultTiers.unshift({
        months: shortestLease,
        price: 0,
        utilitiesIncluded: false
      });
    }

    return defaultTiers.sort((a, b) => a.months - b.months);
  })

  // Comments for approval changes
  const [comment, setComment] = useState('')

  // Auto-update locationString when address fields change
  useEffect(() => {
    const addressParts = [
      formData.city,
      formData.state
    ].filter(part => part && part.trim())
    
    if (addressParts.length > 0) {
      const newLocationString = addressParts.join(', ')
      setFormData(prev => ({
        ...prev,
        locationString: newLocationString
      }))
    }
  }, [formData.city, formData.state])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGeocoding = async () => {
    // Build address from current form data
    const addressParts = [
      formData.streetAddress1,
      formData.streetAddress2,
      formData.city,
      formData.state,
      formData.postalCode
    ].filter(part => part && part.trim())
    
    if (addressParts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Address',
        description: 'Please enter an address before geocoding.',
      })
      return
    }
    
    const fullAddress = addressParts.join(', ')
    
    setIsGeocoding(true)
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`)
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        
        // Update the form with new coordinates
        setFormData(prev => ({
          ...prev,
          latitude: location.lat,
          longitude: location.lng
        }))
        
        toast({
          title: 'Geocoding Successful',
          description: `Coordinates updated: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Geocoding Failed',
          description: 'Could not find coordinates for this address. Please verify the address is correct.',
        })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to geocode address. Please try again.',
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setAmenities(prev => ({
      ...prev,
      [amenity]: checked
    }))
  }

  const handlePricingChange = (index: number, field: 'price' | 'utilitiesIncluded' | 'months', value: any) => {
    setMonthlyPricing(prev =>
      prev.map((pricing, i) =>
        i === index
          ? {
              ...pricing,
              [field]: field === 'price' ? parseFloat(value) || 0
                      : field === 'months' ? parseInt(value) || 1
                      : value
            }
          : pricing
      )
    )
  }

  const addPricingTier = () => {
    // Find the next logical lease length
    const existingMonths = monthlyPricing.map(p => p.months).sort((a, b) => a - b);
    let nextMonths = 1;

    // Find a gap or increment from the highest
    for (let i = 1; i <= 24; i++) {
      if (!existingMonths.includes(i)) {
        nextMonths = i;
        break;
      }
    }

    const newTier = {
      months: nextMonths,
      price: 0,
      utilitiesIncluded: false
    };

    setMonthlyPricing(prev => [...prev, newTier].sort((a, b) => a.months - b.months));
  }

  const removePricingTier = (index: number) => {
    if (monthlyPricing.length > 1) {
      setMonthlyPricing(prev => prev.filter((_, i) => i !== index));
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.description.trim()) errors.push('Description is required')
    if (!formData.city.trim()) errors.push('City is required')
    if (!formData.state.trim()) errors.push('State is required')
    if (!formData.streetAddress1.trim()) errors.push('Street address is required')
    if (formData.roomCount < 1) errors.push('At least 1 bedroom is required')
    if (formData.bathroomCount < 0.5) errors.push('At least 0.5 bathroom is required')
    if (formData.shortestLeaseLength < 1) errors.push('Minimum lease length must be at least 1 month')
    if (formData.longestLeaseLength < formData.shortestLeaseLength) errors.push('Maximum lease length must be greater than or equal to minimum')
    
    // Validate monthly pricing
    if (monthlyPricing.length === 0) {
      errors.push('At least one pricing tier is required')
    } else {
      monthlyPricing.forEach((pricing, index) => {
        if (pricing.price <= 0) {
          errors.push(`Price for ${pricing.months} month${pricing.months > 1 ? 's' : ''} must be greater than 0`)
        }
      })
    }

    return errors
  }

  const handleSave = async () => {
    const errors = validateForm()
    
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Errors',
        description: (
          <ul className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        ),
      })
      return
    }

    setIsLoading(true)
    try {
      // Prepare update data
      const updateData = {
        ...formData,
        ...amenities // Merge amenities into the update
      }

      // Update listing
      await updateListing(listing.id, updateData, comment || undefined)

      // Update pricing if changed
      if (monthlyPricing.length > 0) {
        await updateListingPricing(listing.id, monthlyPricing)
      }

      toast({
        title: 'Success',
        description: 'Listing updated successfully',
      })

      router.push(`/admin/listing-management/${listing.id}`)
    } catch (error) {
      console.error('Error updating listing:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }


  const amenityCategories = {
    'General': ['kitchen', 'wifi', 'airConditioner', 'parking', 'balcony', 'cityView', 'pool', 'gym', 'elevator', 'doorman', 'security'],
    'Laundry': ['washerInUnit', 'washerInComplex', 'washerNotAvailable', 'dryerInUnit', 'dryerInComplex', 'dryerNotAvailable'],
    'Parking': ['offStreetParking', 'streetParking', 'streetParkingFree', 'coveredParking', 'coveredParkingFree', 'uncoveredParking', 'uncoveredParkingFree', 'garageParking', 'garageParkingFree', 'evCharging'],
    'Pets': ['allowDogs', 'allowCats'],
    'Entertainment': ['tv', 'fitnessCenter', 'hotTub', 'sauna', 'jacuzzi', 'grill', 'fireplace', 'firepit'],
    'Kitchen': ['oven', 'stove', 'microwave', 'dishwasher', 'fridge', 'garbageDisposal', 'kitchenEssentials'],
    'Accessibility & Safety': ['wheelchairAccess', 'wheelAccessible', 'elevator', 'smokeDetector', 'carbonMonoxide', 'alarmSystem', 'keylessEntry', 'secureLobby'],
    'Outdoor & Views': ['patio', 'sunroom', 'fencedInYard', 'waterfront', 'beachfront', 'mountainView', 'waterView', 'storageShed', 'gatedEntry']
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Listing: {listing.title}</CardTitle>
            <p className="text-muted-foreground">
              Make changes to the listing details and pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/listing-management/${listing.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="status">Status & Approval</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter property title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the property"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Property Type</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singleFamily">Single Family</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="privateRoom">Private Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <BrandCheckbox
                    name="furnished"
                    label="Furnished"
                    checked={formData.furnished}
                    onChange={(e) => handleInputChange('furnished', e.target.checked)}
                  />
                  
                  <BrandCheckbox
                    name="petsAllowed"
                    label="Pets Allowed"
                    checked={formData.petsAllowed}
                    onChange={(e) => handleInputChange('petsAllowed', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="streetAddress1">Street Address</Label>
                <Input
                  id="streetAddress1"
                  value={formData.streetAddress1}
                  onChange={(e) => handleInputChange('streetAddress1', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              
              <div>
                <Label htmlFor="streetAddress2">Apartment/Unit (Optional)</Label>
                <Input
                  id="streetAddress2"
                  value={formData.streetAddress2}
                  onChange={(e) => handleInputChange('streetAddress2', e.target.value)}
                  placeholder="Apt, Unit, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="locationString">Display Address</Label>
                <Input
                  id="locationString"
                  value={formData.locationString}
                  onChange={(e) => handleInputChange('locationString', e.target.value)}
                  placeholder="e.g., Downtown Austin, Near UT Campus"
                />
              </div>
              
              {/* Coordinates section with geocoding */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Coordinates</Label>
                  {(formData.latitude === 0 && formData.longitude === 0) && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Invalid Coordinates
                    </Badge>
                  )}
                </div>
                
                {(formData.latitude === 0 && formData.longitude === 0) && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This listing has invalid coordinates (0, 0). Please retry geocoding after verifying the address.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                      placeholder="Enter latitude"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                      placeholder="Enter longitude"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocoding}
                  disabled={isGeocoding}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isGeocoding ? 'Geocoding...' : 'Retry Geocoding'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="roomCount">Bedrooms</Label>
                <Input
                  id="roomCount"
                  type="number"
                  min="0"
                  value={formData.roomCount}
                  onChange={(e) => handleInputChange('roomCount', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="bathroomCount">Bathrooms</Label>
                <Input
                  id="bathroomCount"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.bathroomCount}
                  onChange={(e) => handleInputChange('bathroomCount', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  min="0"
                  value={formData.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shortestLeaseLength">Minimum Lease (months)</Label>
                <Input
                  id="shortestLeaseLength"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.shortestLeaseLength}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    handleInputChange('shortestLeaseLength', value)
                    if (value > formData.longestLeaseLength) {
                      handleInputChange('longestLeaseLength', value)
                    }
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="longestLeaseLength">Maximum Lease (months)</Label>
                <Input
                  id="longestLeaseLength"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.longestLeaseLength}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    if (value >= formData.shortestLeaseLength) {
                      handleInputChange('longestLeaseLength', value)
                    }
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-6">
            {Object.entries(amenityCategories).map(([category, amenityList]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenityList.map((amenity) => (
                    <BrandCheckbox
                      key={amenity}
                      name={amenity}
                      label={amenity
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                      checked={amenities[amenity] || false}
                      onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Monthly Pricing Tiers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPricingTier}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Pricing Tier
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="depositSize">Security Deposit ($)</Label>
                  <Input
                    id="depositSize"
                    type="number"
                    min="0"
                    value={formData.depositSize}
                    onChange={(e) => handleInputChange('depositSize', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="petDeposit">Pet Deposit ($)</Label>
                  <Input
                    id="petDeposit"
                    type="number"
                    min="0"
                    value={formData.petDeposit}
                    onChange={(e) => handleInputChange('petDeposit', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="petRent">Monthly Pet Rent ($)</Label>
                  <Input
                    id="petRent"
                    type="number"
                    min="0"
                    value={formData.petRent}
                    onChange={(e) => handleInputChange('petRent', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Monthly Rent by Lease Length</h4>
                <div className="space-y-3">
                  {monthlyPricing.map((pricing, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div>
                        <Label className="text-sm">Lease Length (months)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={pricing.months}
                          onChange={(e) => handlePricingChange(index, 'months', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Monthly Rent ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Monthly rent"
                          value={pricing.price}
                          onChange={(e) => handlePricingChange(index, 'price', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <BrandCheckbox
                          name={`utilities-${index}`}
                          label="Utilities included"
                          checked={pricing.utilitiesIncluded}
                          onChange={(e) => handlePricingChange(index, 'utilitiesIncluded', e.target.checked)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePricingTier(index)}
                          disabled={monthlyPricing.length === 1}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  {monthlyPricing.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No pricing tiers configured. Click &quot;Add Pricing Tier&quot; to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="grid gap-4">
              <BrandCheckbox
                name="markedActiveByUser"
                label="Listing is active"
                checked={formData.markedActiveByUser}
                onChange={(e) => handleInputChange('markedActiveByUser', e.target.checked)}
              />
              
              <div>
                <Label htmlFor="approvalStatus">Approval Status</Label>
                <Select 
                  value={formData.approvalStatus} 
                  onValueChange={(value) => handleInputChange('approvalStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendingReview">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="comment">Comments (for approval status changes)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter comments about the approval decision (optional)"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Images</h3>
              <p className="text-sm text-gray-600">
                Images are managed through the host interface. This section shows current images for reference.
              </p>
              {listing.listingImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {listing.listingImages.map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                      <Image
                        src={image.url}
                        alt={`Property image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {image.rank && (
                        <Badge 
                          className="absolute top-2 left-2 bg-blue-100 text-blue-800 border-blue-200"
                        >
                          {image.rank}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No images available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

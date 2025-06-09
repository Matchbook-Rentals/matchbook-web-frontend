"use client";

import React from 'react';
import { ListingAndImages } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, DollarSign, Calendar, User, Bed, Bath, Square, Wifi, Car, Heart, Users, Building, PawPrint } from 'lucide-react';

interface SummaryTabProps {
  listing: ListingAndImages;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ listing }) => {
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
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{formatAddress()}</p>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Pricing & Lease Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Lease Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Guests & Pets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      {listing.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryTab;
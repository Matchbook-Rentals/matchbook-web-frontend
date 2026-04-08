'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandButton } from '@/components/ui/brandButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, DollarSign, User } from 'lucide-react';
import type { MatchDetails } from './types';

interface TripConfigurationProps {
  title?: string;
  description?: string;
  defaultValues?: Partial<MatchDetails>;
  onConfigure: (matchDetails: MatchDetails) => void;
  onCancel?: () => void;
}

export const TripConfiguration: React.FC<TripConfigurationProps> = ({
  title = "Configure Trip Details",
  description = "Enter the listing and trip information for this lease document",
  defaultValues = {},
  onConfigure,
  onCancel
}) => {
  const [formData, setFormData] = useState<MatchDetails>({
    propertyAddress: defaultValues.propertyAddress || "123 Main St, New York, NY 10001",
    monthlyPrice: defaultValues.monthlyPrice || "2,500.00",
    hostName: defaultValues.hostName || "John Smith",
    hostEmail: defaultValues.hostEmail || "host@example.com",
    primaryRenterName: defaultValues.primaryRenterName || "Jane Doe",
    primaryRenterEmail: defaultValues.primaryRenterEmail || "renter@example.com",
    startDate: defaultValues.startDate || "2024-01-01",
    endDate: defaultValues.endDate || "2024-12-31"
  });

  const handleInputChange = (field: keyof MatchDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    onConfigure(formData);
  };

  const isValid = Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-[#020202]">{title}</h2>
        <p className="text-[#777b8b]">{description}</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Trip & Listing Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Property Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  placeholder="123 Main St, City, State, ZIP"
                  value={formData.propertyAddress}
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthlyPrice" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Monthly Price
                </Label>
                <Input
                  id="monthlyPrice"
                  placeholder="2,500.00"
                  value={formData.monthlyPrice}
                  onChange={(e) => handleInputChange('monthlyPrice', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Host Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Host Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hostName">Host Name</Label>
                <Input
                  id="hostName"
                  placeholder="John Smith"
                  value={formData.hostName}
                  onChange={(e) => handleInputChange('hostName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hostEmail">Host Email</Label>
                <Input
                  id="hostEmail"
                  type="email"
                  placeholder="host@example.com"
                  value={formData.hostEmail}
                  onChange={(e) => handleInputChange('hostEmail', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Renter Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Primary Renter Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryRenterName">Primary Renter Name</Label>
                <Input
                  id="primaryRenterName"
                  placeholder="Jane Doe"
                  value={formData.primaryRenterName}
                  onChange={(e) => handleInputChange('primaryRenterName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="primaryRenterEmail">Primary Renter Email</Label>
                <Input
                  id="primaryRenterEmail"
                  type="email"
                  placeholder="renter@example.com"
                  value={formData.primaryRenterEmail}
                  onChange={(e) => handleInputChange('primaryRenterEmail', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Lease Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Lease Period
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <BrandButton 
              className="flex-1"
              disabled={!isValid}
              onClick={handleContinue}
            >
              {isValid ? 'Continue to Template Selection' : 'Fill All Fields to Continue'}
            </BrandButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
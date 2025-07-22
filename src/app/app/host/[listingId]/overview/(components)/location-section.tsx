import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, PencilIcon } from 'lucide-react';
import { handleLocationUpdate } from './overview-handlers';

interface LocationSectionProps {
  listingId: string;
  editingSections: Record<string, boolean>;
  formData: any;
  currentListing: any;
  sectionFields: Record<string, string[]>;
  updateFormData: (field: string, value: any) => void;
  setShowLocationBrandDialog: (show: boolean) => void;
  setCurrentListing: (listing: any) => void;
  setEditingSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  formatAddress: () => string;
  noLabelStyles: string;
  onListingUpdate?: (listing: any) => void;
  userId?: string;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  listingId,
  editingSections,
  formData,
  currentListing,
  sectionFields,
  updateFormData,
  setShowLocationBrandDialog,
  setCurrentListing,
  setEditingSections,
  formatAddress,
  noLabelStyles,
  onListingUpdate,
  userId
}) => {
  const handleSave = async () => {
    await handleLocationUpdate(
      listingId,
      formData,
      sectionFields,
      setCurrentListing,
      setEditingSections,
      onListingUpdate,
      currentListing,
      userId
    );
  };

  const renderLocationEditButtons = () => (
    <div className="flex gap-2">
      <Button
        onClick={handleSave}
        className="bg-[#3c8787] hover:bg-[#2d6565] text-white"
      >
        Save
      </Button>
      <Button
        variant="outline"
        onClick={() => setEditingSections(prev => ({ ...prev, location: false }))}
      >
        Cancel
      </Button>
    </div>
  );
  return (
    <Card className="shadow-[0px_0px_5px_#00000029] p-0 lg:min-h-[140px]">
      <CardContent className="flex flex-col items-end gap-[18px] p-6">
        <div className="flex items-center justify-end gap-8 relative flex-1 self-stretch w-full">
          <div className="relative flex-1 opacity-90 text-2xl font-semibold text-gray-900">
            Location
          </div>
          {editingSections['location'] ? renderLocationEditButtons() : <PencilIcon className="w-6 h-6 cursor-pointer" onClick={() => setShowLocationBrandDialog(true)} />}
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
  );
};
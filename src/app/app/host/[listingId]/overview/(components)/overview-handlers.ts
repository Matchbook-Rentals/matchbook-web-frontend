import { updateListingLocation, saveLocationChangeHistory } from '@/app/actions/listings';
import { revalidateListingCache } from '@/app/app/host/_actions';
import { toast } from '@/components/ui/use-toast';

export const handleLocationUpdate = async (
  listingId: string,
  formData: any,
  sectionFields: Record<string, string[]>,
  setCurrentListing: (listing: any) => void,
  setEditingSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  onListingUpdate?: (listing: any) => void,
  currentListing?: any,
  userId?: string
) => {
  try {
    const locationFields = sectionFields['location'] || [];
    const updateData: any = {};
    const changedFields: string[] = [];
    
    // Only include fields that have changed (if we have currentListing for comparison)
    locationFields.forEach(field => {
      const currentValue = formData[field as keyof typeof formData];
      
      if (currentListing) {
        const originalValue = currentListing[field as keyof typeof currentListing];
        // Only include fields that have changed
        if (currentValue !== originalValue) {
          updateData[field] = currentValue;
          changedFields.push(field);
        }
      } else {
        // If no comparison available, include all fields
        updateData[field] = currentValue;
        changedFields.push(field);
      }
    });

    if (Object.keys(updateData).length > 0 && currentListing) {
      // Save location change history before updating
      await saveLocationChangeHistory(
        listingId,
        currentListing,
        formData,
        changedFields,
        userId
      );
      
      console.log('Updating location with data:', updateData);
      const updatedListing = await updateListingLocation(listingId, updateData);
      
      // Invalidate listing cache
      await revalidateListingCache(listingId);
      
      // Update the current listing with the new data
      setCurrentListing(updatedListing);
      
      // If there's a callback for parent component updates, call it
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
      });
    } else {
      console.log('No changes detected for location section');
    }

  } catch (error) {
    console.error('Error updating location:', error);
    toast({
      title: "Error",
      description: "Failed to update location. Please try again.",
      variant: "destructive"
    });
  }
};
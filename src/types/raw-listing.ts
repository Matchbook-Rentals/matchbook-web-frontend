export type RawListingResult = {
  // Listing fields
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  price: number;
  // ... other listing fields

  // Calculated distance
  distance: number;

  // Image fields
  imageId: string | null;
  imageUrl: string | null;

  // Bedroom fields
  bedroomId: string | null;
  bedroomNumber: number | null;
  bedType: string | null;

  // User fields
  userId: string;
  userFirstName: string | null;
  userLastName: string | null;
  userFullName: string | null;
  userEmail: string | null;
  userImageUrl: string | null;
  userCreatedAt: Date;

  // Unavailability fields
  unavailabilityId: string | null;
  unavailabilityStartDate: Date | null;
  unavailabilityEndDate: Date | null;
}
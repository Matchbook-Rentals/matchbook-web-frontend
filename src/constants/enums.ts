export enum ListingStatus {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  None = 'none'
}

export enum PropertyType {
  SingleFamily = 'singleFamily',
  Apartment = 'apartment',
  Townhouse = 'townhouse',
  PrivateRoom = 'privateRoom'
}

/**
 * Normalizes category string to PropertyType enum value
 * Handles inconsistent casing and formatting from database
 */
export function normalizeCategory(category: string | null | undefined): string | null {
  if (!category) return category ?? null;

  // Normalize to lowercase and remove spaces
  const normalized = category.toLowerCase().replace(/\s+/g, '');

  // Map to PropertyType enum values
  switch (normalized) {
    case 'singlefamily':
    case 'single-family':
    case 'house':
      return PropertyType.SingleFamily;
    case 'apartment':
    case 'apt':
      return PropertyType.Apartment;
    case 'townhouse':
    case 'town-house':
    case 'townhome':
      return PropertyType.Townhouse;
    case 'privateroom':
    case 'private-room':
    case 'room':
      return PropertyType.PrivateRoom;
    default:
      // Return normalized value if it already matches an enum value
      if (Object.values(PropertyType).includes(normalized as PropertyType)) {
        return normalized;
      }
      // Fallback to original if no match
      return category;
  }
}

/**
 * Converts PropertyType enum value to human-readable display string
 */
export function getCategoryDisplay(category: string | null | undefined): string {
  if (!category) return 'Property';

  switch (category) {
    case PropertyType.SingleFamily:
      return 'Single Family';
    case PropertyType.Apartment:
      return 'Apartment';
    case PropertyType.Townhouse:
      return 'Townhouse';
    case PropertyType.PrivateRoom:
      return 'Private Room';
    default:
      return 'Property';
  }
}

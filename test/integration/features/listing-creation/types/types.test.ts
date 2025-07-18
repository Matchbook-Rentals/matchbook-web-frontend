import { describe, it, expect } from 'vitest';
import { DraftData, ListingData, MonthlyPricing } from '@/features/listing-creation/types';

describe('Listing Creation Types', () => {
  it('should define DraftData with optional fields', () => {
    const draft: DraftData = { id: '123', title: null };
    expect(draft.id).toBe('123');
    expect(draft.title).toBeNull();
  });

  it('should define ListingData with required fields', () => {
    const listing: ListingData = { title: 'Test', monthlyPricing: [] };
    expect(listing.title).toBe('Test');
    expect(listing.monthlyPricing).toEqual([]);
  });

  it('should define MonthlyPricing with number and boolean fields', () => {
    const pricing: MonthlyPricing = { months: 3, price: '1000', utilitiesIncluded: true };
    expect(typeof pricing.months).toBe('number');
    expect(typeof pricing.price).toBe('string');
    expect(typeof pricing.utilitiesIncluded).toBe('boolean');
  });

  it('should support complex DraftData with all fields', () => {
    const draft: DraftData = {
      id: '456',
      title: 'Beautiful Apartment',
      description: 'A lovely place to stay',
      status: 'draft',
      locationString: '123 Main St',
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      state: 'NY',
      streetAddress1: '123 Main St',
      streetAddress2: 'Apt 4B',
      postalCode: '10001',
      roomCount: 2,
      bathroomCount: 1,
      guestCount: 4,
      squareFootage: 800,
      depositSize: 2000,
      petDeposit: 500,
      petRent: 50,
      rentDueAtBooking: 1000,
      shortestLeaseLength: 1,
      longestLeaseLength: 12,
      shortestLeasePrice: 2000,
      longestLeasePrice: 1800,
      requireBackgroundCheck: true,
      category: 'Apartment',
      petsAllowed: true,
      furnished: false,
      listingImages: [
        { url: 'https://example.com/image1.jpg', rank: 1 }
      ],
      monthlyPricing: [
        { months: 1, price: 2000, utilitiesIncluded: false },
        { months: 12, price: 1800, utilitiesIncluded: true }
      ]
    };
    
    expect(draft.id).toBe('456');
    expect(draft.title).toBe('Beautiful Apartment');
    expect(draft.roomCount).toBe(2);
    expect(draft.petsAllowed).toBe(true);
    expect(draft.listingImages).toHaveLength(1);
    expect(draft.monthlyPricing).toHaveLength(2);
  });

  it('should support ListingData with images and pricing', () => {
    const listing: ListingData = {
      title: 'Test Listing',
      listingImages: [
        { url: 'https://example.com/image1.jpg', category: 'bedroom', rank: 1 },
        { url: 'https://example.com/image2.jpg', category: 'living', rank: 2 }
      ],
      monthlyPricing: [
        { months: 1, price: 2000, utilitiesIncluded: false },
        { months: 6, price: 1900, utilitiesIncluded: true }
      ]
    };
    
    expect(listing.title).toBe('Test Listing');
    expect(listing.listingImages).toHaveLength(2);
    expect(listing.monthlyPricing).toHaveLength(2);
    expect(listing.listingImages![0].category).toBe('bedroom');
    expect(listing.monthlyPricing![0].utilitiesIncluded).toBe(false);
  });
});
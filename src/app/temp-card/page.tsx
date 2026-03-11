import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { ListingAndImages } from '@/types';

const mockListing: ListingAndImages = {
  id: 'temp-123',
  title: 'Your Home Away from Home',
  city: '',
  state: 'TX',
  roomCount: 3,
  bathroomCount: 2,
  category: 'Home',
  listingImages: [
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
      listingId: 'temp-123',
      order: 0,
    }
  ],
  shortestLeasePrice: 2800,
} as ListingAndImages;

export default function TempCardPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg">
        <HomepageListingCard listing={mockListing} />
      </div>
    </div>
  );
}

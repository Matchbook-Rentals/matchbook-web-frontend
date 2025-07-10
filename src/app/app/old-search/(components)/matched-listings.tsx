import { MatchedListings } from '@/components/MatchedListings';

export default function SearchMatchbookTab() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Matched Listings</h1>
      <MatchedListings />
    </div>
  );
}
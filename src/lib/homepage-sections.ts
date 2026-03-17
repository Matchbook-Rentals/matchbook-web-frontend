import { ListingWithRelations } from '@/types';
import { ListingSection } from '@/components/home-components/popular-listings-section';
import {
  getListingsByLocation,
  getListingsNearLocation,
} from '@/app/actions/listings';
import { HomepageUserState } from '@/app/actions/homepage-user-state';
import { IpLocation } from '@/lib/ip-geolocation';

interface UserTripLocation {
  city: string | null;
  state: string | null;
  locationString: string | null;
  latitude?: number;
  longitude?: number;
  searchRadius?: number | null;
}

interface PopularArea {
  city: string;
  state: string;
  count: number;
  avgLat: number;
  avgLng: number;
}

export interface BuildHomepageSectionsInput {
  isSignedIn: boolean;
  userTripLocation: UserTripLocation | null;
  popularAreas: PopularArea[];
  userState?: HomepageUserState | null;
  recentTripId?: string | null;
  ipLocation?: IpLocation | null;
}

const LISTINGS_PER_ROW = 12;

export async function buildHomepageSections(input: BuildHomepageSectionsInput): Promise<ListingSection[]> {
  const { isSignedIn, userTripLocation, popularAreas, userState, recentTripId, ipLocation } = input;

  const newSections: ListingSection[] = [];
  const usedLocations = new Set<string>();
  const userLocation = ipLocation ? { lat: ipLocation.lat, lng: ipLocation.lng } : null;

  const makeLocationKey = (city: string | null, state: string | null) =>
    `${city?.toLowerCase() || ''}-${state?.toLowerCase() || ''}`;

  // --- Determine Row 1 source and mark it used ---
  const hasUserTrip = isSignedIn && userTripLocation && (userTripLocation.city || userTripLocation.latitude);
  if (hasUserTrip) {
    usedLocations.add(makeLocationKey(userTripLocation!.city, userTripLocation!.state));
  } else if (popularAreas.length > 0) {
    usedLocations.add(makeLocationKey(popularAreas[0].city, popularAreas[0].state));
  }

  // --- Pre-select candidate popular areas for rows 2-4 ---
  const candidateAreas = popularAreas.filter(
    (a) => !usedLocations.has(makeLocationKey(a.city, a.state))
  ).slice(0, 3);

  // --- Fire all fetches in parallel ---
  const row1Fetch = (): Promise<ListingWithRelations[]> => {
    if (hasUserTrip) {
      if (userTripLocation!.city) {
        return getListingsByLocation(userTripLocation!.city, userTripLocation!.state, LISTINGS_PER_ROW);
      }
      if (userTripLocation!.latitude && userTripLocation!.longitude) {
        return getListingsNearLocation(userTripLocation!.latitude, userTripLocation!.longitude, LISTINGS_PER_ROW);
      }
    } else if (popularAreas.length > 0) {
      return getListingsByLocation(popularAreas[0].city, popularAreas[0].state, LISTINGS_PER_ROW);
    }
    return Promise.resolve([]);
  };

  const [row1Listings, nearMeListings, ...candidateListings] = await Promise.all([
    row1Fetch(),
    userLocation
      ? getListingsNearLocation(userLocation.lat, userLocation.lng, LISTINGS_PER_ROW)
      : Promise.resolve(null),
    ...candidateAreas.map(area =>
      getListingsByLocation(area.city, area.state, LISTINGS_PER_ROW)
    ),
  ]);

  // --- Assemble Row 1 ---
  if (hasUserTrip) {
    const displayName = userTripLocation!.locationString || userTripLocation!.city || 'your area';
    const tripCenter = userTripLocation!.latitude && userTripLocation!.longitude
      ? { lat: userTripLocation!.latitude, lng: userTripLocation!.longitude }
      : undefined;
    newSections.push({
      title: `Your recent search in ${displayName}`,
      listings: row1Listings,
      showBadges: true,
      center: tripCenter,
      locationString: displayName,
      city: userTripLocation!.city || undefined,
      state: userTripLocation!.state || undefined,
      sectionTripId: recentTripId || undefined,
    });
  } else if (popularAreas.length > 0) {
    const firstArea = popularAreas[0];
    newSections.push({
      title: `Explore monthly rentals in ${firstArea.city}`,
      listings: row1Listings,
      showBadges: false,
      center: { lat: firstArea.avgLat, lng: firstArea.avgLng },
      locationString: `${firstArea.city}, ${firstArea.state}`,
      city: firstArea.city,
      state: firstArea.state,
    });
  }

  // --- Assemble Row 2 ---
  let candidateStartIndex = 0;
  if (userLocation && nearMeListings && nearMeListings.length > 0) {
    newSections.push({
      title: 'Monthly rentals near me',
      listings: nearMeListings,
      center: userLocation,
      locationString: 'Near me',
    });
  } else if (candidateAreas.length > 0) {
    const fallbackArea = candidateAreas[0];
    newSections.push({
      title: `Explore monthly rentals in ${fallbackArea.city}`,
      listings: candidateListings[0],
      center: { lat: fallbackArea.avgLat, lng: fallbackArea.avgLng },
      locationString: `${fallbackArea.city}, ${fallbackArea.state}`,
      city: fallbackArea.city,
      state: fallbackArea.state,
    });
    usedLocations.add(makeLocationKey(fallbackArea.city, fallbackArea.state));
    candidateStartIndex = 1;
  }

  // --- Assemble Rows 3-4 from remaining candidates ---
  for (let i = candidateStartIndex; i < candidateAreas.length && newSections.length < 4; i++) {
    const area = candidateAreas[i];
    newSections.push({
      title: `Explore monthly rentals in ${area.city}`,
      listings: candidateListings[i],
      center: { lat: area.avgLat, lng: area.avgLng },
      locationString: `${area.city}, ${area.state}`,
      city: area.city,
      state: area.state,
    });
  }

  // Sort: matched first, then liked, then others
  if (userState) {
    for (const section of newSections) {
      section.listings.sort((a, b) => {
        const priorityA = userState.matchedListings?.some(m => m.listingId === a.id) ? 0 :
                          userState.favoritedListingIds?.includes(a.id) ? 1 : 2;
        const priorityB = userState.matchedListings?.some(m => m.listingId === b.id) ? 0 :
                          userState.favoritedListingIds?.includes(b.id) ? 1 : 2;
        return priorityA - priorityB;
      });
    }
  }

  return newSections;
}

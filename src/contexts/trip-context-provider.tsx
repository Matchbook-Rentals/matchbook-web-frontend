"use client";
import React from "react";
import { ListingAndImages, TripAndMatches } from "@/types";
import { createContext, useState } from "react";
import { Dispatch, SetStateAction } from 'react';

type TripContextProviderProps = {
  tripData: TripAndMatches;
  pullTripFromDb: Function;
  createDbFavorite: Function;
  deleteDbFavorite: Function;
  createDbDislike: Function;
  deleteDbDislike: Function;
  listingData: ListingAndImages[];
  children: React.ReactNode;
};

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

interface TripLookup {
  favMap: Map<string | null, number | null>;
  dislikedIds: Set<string | null>;
  requestedIds: Set<string | null>;
}

interface TTripContext {
  trip: TripAndMatches;
  setTrip: Dispatch<SetStateAction<TripAndMatches>>;
  viewedListings: ViewedListing[];
  setViewedListings: Dispatch<SetStateAction<ViewedListing[]>>;
  showListings: ListingAndImages[];
  setShowListings: Dispatch<SetStateAction<ListingAndImages[]>>;
  likedListings: ListingAndImages[];
  //setLikedListings: Dispatch<SetStateAction<ListingAndImages[]>>;
  lookup: TripLookup;
  setLookup: Dispatch<SetStateAction<TripLookup>>;
  actions: {
    createDbFavorite: Function;
    deleteDbFavorite: Function;
    createDbDislike: Function;
    deleteDbDislike: Function;
  };
}

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({
  tripData,
  listingData,
  pullTripFromDb,
  createDbFavorite,
  deleteDbFavorite,
  createDbDislike,
  deleteDbDislike,
  children,
}: TripContextProviderProps) {
  const [trip, setTrip] = useState(tripData);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  
  const initialLookup: TripLookup = {
    favMap: new Map(trip.favorites.map(favorite => [favorite.listingId, favorite.rank])),
    dislikedIds: new Set(trip.dislikes.map(dislike => dislike.listingId)),
    requestedIds: new Set(trip.housingRequests.map(request => request.listingId))
  };
  
  const [lookup, setLookup] = useState<TripLookup>(initialLookup);

  const getRank = (listingId: string) => lookup.favMap.get(listingId) ?? Infinity;

  const [showListings, setShowListings] = useState<ListingAndImages[]>(
    listingData.filter((listing) => !lookup.favMap.has(listing.id))
  );

const likedListings = React.useMemo(() => {
  return listingData
    .filter((listing) => lookup.favMap.has(listing.id))
    .sort((a, b) => getRank(a.id) - getRank(b.id));
}, [lookup.favMap, listingData, getRank]);

  //const [likedListings, setLikedListings] = useState<ListingAndImages[]>(
  //  listingData
  //    .filter((listing) => lookup.favMap.has(listing.id))
  //    .sort((a, b) => getRank(a.id) - getRank(b.id))
  //);

  const actions = {
    getUpdatedTrip: async () => {
      const tempTrip = await pullTripFromDb(trip.id);
      setTrip(tempTrip);
    },
    createDbFavorite,
    deleteDbFavorite,
    createDbDislike,
    deleteDbDislike,
  };

  return (
    <TripContext.Provider
      value={{
        trip,
        setTrip,
        viewedListings,
        setViewedListings,
        showListings,
        setShowListings,
        likedListings,
        //setLikedListings,
        lookup,
        setLookup,
        actions,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

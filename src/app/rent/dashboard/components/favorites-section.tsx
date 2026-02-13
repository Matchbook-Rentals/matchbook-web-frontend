'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SectionEmptyState } from './section-empty-state';
import { useToast } from '@/components/ui/use-toast';
import { optimisticRemoveFavorite, optimisticFavorite } from '@/app/actions/favorites';
import { getMoreFavorites } from '@/app/actions/renter-dashboard';
import { Button } from '@/components/ui/button';
import type { DashboardFavorite } from '@/app/actions/renter-dashboard';

interface FavoritesSectionProps {
  favorites: DashboardFavorite[];
  hasMoreFavorites: boolean;
}

export const FavoritesSection = ({ favorites: initialFavorites, hasMoreFavorites: initialHasMore }: FavoritesSectionProps) => {
  const [allFavorites, setAllFavorites] = useState<DashboardFavorite[]>(initialFavorites);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [gridColumns, setGridColumns] = useState(2);
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [hiddenFavoriteIds, setHiddenFavoriteIds] = useState<Set<string>>(new Set());

  // Filter out hidden favorites (for optimistic UI after unlike)
  const visibleFavorites = allFavorites.filter((fav) => !hiddenFavoriteIds.has(fav.id));

  // Transform favorites to listing format for HomepageListingCard
  const favoriteListings = visibleFavorites
    .filter((fav) => fav.listing !== null)
    .map((fav) => ({
      ...fav.listing,
      listingImages: fav.listing?.listingImages?.map((img) => ({
        ...img,
        listingId: fav.listingId,
        category: null,
        rank: 0,
        createdAt: new Date(),
      })) || [],
    }));

  // Handle unlike with undo toast
  const handleUnlike = useCallback(async (listingId: string) => {
    const favorite = allFavorites.find((fav) => fav.listingId === listingId);
    if (!favorite) return;

    // Optimistic UI - hide the favorite immediately
    setHiddenFavoriteIds((prev) => new Set(prev).add(favorite.id));

    // Remove from database
    const result = await optimisticRemoveFavorite(favorite.tripId, listingId);

    if (!result.success) {
      // If failed, show error and restore the favorite
      setHiddenFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(favorite.id);
        return next;
      });
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive',
      });
      return;
    }

    // Show success toast with undo option
    const listingTitle = favorite.listing?.title || 'Listing';
    const { dismiss } = toast({
      title: 'Removed from favorites',
      description: `${listingTitle} has been removed from your favorites`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            // Restore the favorite
            setHiddenFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(favorite.id);
              return next;
            });

            // Re-add to database
            const undoResult = await optimisticFavorite(favorite.tripId, listingId);

            if (!undoResult.success) {
              toast({
                title: 'Error',
                description: 'Failed to undo. Please try adding the favorite again.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Restored',
                description: `${listingTitle} has been added back to your favorites`,
              });
            }

            dismiss();
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [allFavorites, toast]);

  // Track grid columns for responsive layout
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setGridColumns(5);
      else if (width >= 768) setGridColumns(4);
      else if (width >= 640) setGridColumns(3);
      else setGridColumns(2);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  // Load more favorites from server
  const loadMoreFavorites = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const lastFavorite = allFavorites[allFavorites.length - 1];
      if (!lastFavorite) return;

      const result = await getMoreFavorites(lastFavorite.createdAt);

      setAllFavorites((prev) => [...prev, ...result.favorites]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more favorites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [allFavorites, hasMore, isLoading, toast]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreFavorites();
        }
      },
      { root: null, rootMargin: '400px', threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreFavorites]);

  return (
    <section className="mb-8 overflow-x-hidden">
      <Accordion type="single" collapsible defaultValue="favorites">
        <AccordionItem value="favorites" className="border-b-0">
          <AccordionTrigger className="py-1 mb-4 hover:no-underline justify-start gap-1">
            <span className="font-poppins font-semibold text-[#484a54] text-sm">
              Favorites
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {visibleFavorites.length === 0 ? (
              <SectionEmptyState
                imageSrc="/empty-states/no-favorites.png"
                title="No favorites yet"
              />
            ) : (
              <>
                <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {visibleFavorites.map((fav, index) => (
                    <HomepageListingCard
                      key={fav.id}
                      listing={favoriteListings[index] as any}
                      badge="liked"
                      tripId={fav.tripId}
                      isApplied={fav.isApplied}
                      initialFavorited={true}
                      onUnlike={handleUnlike}
                      isSignedIn={true}
                    />
                  ))}
                </div>

                {/* Loading indicator and infinite scroll trigger */}
                {(hasMore || isLoading) && (
                  <div ref={loadingRef} className="flex justify-center items-center py-8">
                    {isLoading && (
                      <div className="text-sm text-gray-500">Loading more favorites...</div>
                    )}
                  </div>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

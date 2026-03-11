"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { GuestSessionService } from "@/utils/guest-session";
import { checkExistingGuestConversion } from "@/app/actions/guest-conversion";
import { getGuestSession } from "@/app/actions/guest-session-db";
import { createTripFromGuestSession } from "@/app/actions/trips";
import { convertGuestSessionToTrip } from "@/app/actions/guest-to-trip";

const SYNC_PROCESSED_KEY = 'guest_favorites_synced';

function wasSyncProcessed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SYNC_PROCESSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function markSyncProcessed(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SYNC_PROCESSED_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Syncs guest favorites to an authenticated Trip when user signs in.
 * Follows the ReferralProcessor pattern: mounted in root layout,
 * uses useUser() hook, sessionStorage guard to prevent re-processing.
 */
export function GuestFavoriteSyncProcessor() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) return;
    if (processed || wasSyncProcessed()) return;

    const guestSessionId = GuestSessionService.getSessionIdFromCookie();
    if (!guestSessionId) return;

    const syncGuestFavorites = async () => {
      try {
        // Check if already converted
        const conversionCheck = await checkExistingGuestConversion(guestSessionId);
        if (!conversionCheck.success || conversionCheck.alreadyConverted) {
          GuestSessionService.clearSession();
          return;
        }

        // Check if session has any favorites/dislikes worth migrating
        if (!conversionCheck.hasData) {
          GuestSessionService.clearSession();
          return;
        }

        // Get guest session data to create a Trip with matching search params
        const session = await getGuestSession(guestSessionId);
        if (!session) {
          GuestSessionService.clearSession();
          return;
        }

        // Create an authenticated Trip from the guest session data
        const tripResult = await createTripFromGuestSession(session);
        if (!tripResult.success || !tripResult.tripId) {
          console.error('[GuestFavoriteSync] Failed to create trip from guest session');
          return;
        }

        // Migrate all favorites/dislikes to the new Trip
        const migrationResult = await convertGuestSessionToTrip(guestSessionId, tripResult.tripId);
        if (migrationResult.success) {
          console.log(`[GuestFavoriteSync] Migrated ${migrationResult.favoritesCount} favorites and ${migrationResult.dislikesCount} dislikes`);
        }

        // Clear guest session cookie/localStorage
        GuestSessionService.clearSession();
      } catch (error) {
        console.error('[GuestFavoriteSync] Error syncing guest favorites:', error);
      }
    };

    syncGuestFavorites().finally(() => {
      markSyncProcessed();
      setProcessed(true);
    });
  }, [isLoaded, isSignedIn, user, processed]);

  return null;
}

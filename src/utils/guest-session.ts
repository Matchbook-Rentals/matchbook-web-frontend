// Guest session storage utilities
// Now uses database storage with lightweight cookie fallback

import { getGuestSession } from '@/app/actions/guest-session-db';

export interface GuestSession {
  id: string;
  searchParams: {
    location: string;
    lat: number;
    lng: number;
    startDate?: Date;
    endDate?: Date;
    guests: {
      adults: number;
      children: number;
      pets: number;
    };
  };
  pendingActions: {
    type: 'like' | 'apply' | 'contact';
    listingId: string;
    timestamp: number;
  }[];
  createdAt: number;
  expiresAt: number;
  tripId?: string; // Set when guest session is converted to authenticated trip
}

const GUEST_SESSION_ID_KEY = 'matchbook_guest_session_id'; // Now just stores the ID
const GUEST_SESSION_CACHE_KEY = 'matchbook_guest_session_cache'; // Temporary cache

export class GuestSessionService {
  /**
   * Store session ID in lightweight cookie and cache session data locally
   * The actual session data is stored in the database
   */
  static storeSession(session: GuestSession): boolean {
    try {
      if (typeof window === 'undefined') return false;

      // Store only session ID in cookie (much smaller than full JSON)
      const maxAge = 24 * 60 * 60; // 24 hours in seconds
      document.cookie = `${GUEST_SESSION_ID_KEY}=${session.id}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;

      // Cache full session data in localStorage for better performance
      const sessionForStorage = {
        ...session,
        searchParams: {
          ...session.searchParams,
          startDate: session.searchParams.startDate?.toISOString(),
          endDate: session.searchParams.endDate?.toISOString(),
        },
      };
      localStorage.setItem(GUEST_SESSION_CACHE_KEY, JSON.stringify(sessionForStorage));

      return true;
    } catch (error) {
      console.error('Failed to store guest session:', error);
      return false;
    }
  }

  /**
   * Get session from cache first, then fall back to cookie ID lookup
   * This is a client-side method - server-side should use getGuestSession action directly
   */
  static getSession(): GuestSession | null {
    try {
      if (typeof window === 'undefined') return null;

      // Try to get from localStorage cache first
      const cached = localStorage.getItem(GUEST_SESSION_CACHE_KEY);
      if (cached) {
        const session = JSON.parse(cached);

        // Check if cached session is expired
        if (Date.now() <= session.expiresAt) {
          // Convert date strings back to Date objects
          return {
            ...session,
            searchParams: {
              ...session.searchParams,
              startDate: session.searchParams.startDate ? new Date(session.searchParams.startDate) : undefined,
              endDate: session.searchParams.endDate ? new Date(session.searchParams.endDate) : undefined,
            },
          };
        } else {
          // Clear expired cache
          this.clearSession();
        }
      }

      // If no cache, try to get session ID from cookie for server fetch
      // This is a fallback - components should use server actions for fresh data
      const sessionId = this.getSessionIdFromCookie();
      if (sessionId) {
        // Note: This requires a server action call, which should be done in components
        console.warn('GuestSessionService.getSession(): Session ID found but no cache. Use getGuestSession server action instead.');
        return null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get guest session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Get session ID from cookie (lightweight)
   */
  static getSessionIdFromCookie(): string | null {
    try {
      if (typeof window === 'undefined') return null;

      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      return cookies[GUEST_SESSION_ID_KEY] || null;
    } catch (error) {
      console.error('Failed to get session ID from cookie:', error);
      return null;
    }
  }

  static getSessionById(sessionId: string): GuestSession | null {
    const session = this.getSession();
    return session?.id === sessionId ? session : null;
  }

  static clearSession(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_SESSION_CACHE_KEY);
        // Clear the cookie
        document.cookie = `${GUEST_SESSION_ID_KEY}=; path=/; max-age=0`;
      }
    } catch (error) {
      console.error('Failed to clear guest session:', error);
    }
  }

  static addPendingAction(action: GuestSession['pendingActions'][0]): boolean {
    try {
      const session = this.getSession();
      if (!session) return false;

      session.pendingActions.push(action);
      return this.storeSession(session);
    } catch (error) {
      console.error('Failed to add pending action:', error);
      return false;
    }
  }

  static isSessionValid(sessionId?: string): boolean {
    if (!sessionId) return false;

    const session = this.getSessionById(sessionId);
    return session !== null && Date.now() < session.expiresAt;
  }

  static extendSession(additionalHours: number = 24): boolean {
    try {
      const session = this.getSession();
      if (!session) return false;

      session.expiresAt = Date.now() + (additionalHours * 60 * 60 * 1000);
      return this.storeSession(session);
    } catch (error) {
      console.error('Failed to extend guest session:', error);
      return false;
    }
  }

  static createGuestSessionData(tripData: {
    locationString: string;
    latitude: number;
    longitude: number;
    startDate?: Date | null;
    endDate?: Date | null;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  }, sessionId: string): GuestSession {
    const today = new Date();
    let { startDate, endDate } = tripData;

    // Handle date logic (same as server action)
    if (!startDate && !endDate) {
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    } else if (startDate && !endDate) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (!startDate && endDate) {
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return {
      id: sessionId,
      searchParams: {
        location: tripData.locationString,
        lat: tripData.latitude,
        lng: tripData.longitude,
        startDate,
        endDate,
        guests: {
          adults: tripData.numAdults || 1,
          children: tripData.numChildren || 0,
          pets: tripData.numPets || 0,
        },
      },
      pendingActions: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
  }

  static markAsConverted(sessionId: string, tripId: string): boolean {
    try {
      const session = this.getSessionById(sessionId);
      if (!session) return false;

      session.tripId = tripId;
      return this.storeSession(session);
    } catch (error) {
      console.error('Failed to mark session as converted:', error);
      return false;
    }
  }

  static getConvertedTripId(sessionId: string): string | null {
    try {
      const session = this.getSessionById(sessionId);
      return session?.tripId || null;
    } catch (error) {
      console.error('Failed to get converted trip ID:', error);
      return null;
    }
  }

  static isSessionConverted(sessionId: string): boolean {
    return this.getConvertedTripId(sessionId) !== null;
  }

  /**
   * Server-side method to get session ID from cookies
   * Use this with getGuestSession server action to fetch full session data
   */
  static getSessionIdFromCookies(cookieHeader?: string): string | null {
    try {
      if (!cookieHeader) return null;

      // Parse cookies
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      return cookies[GUEST_SESSION_ID_KEY] || null;
    } catch (error) {
      console.error('Failed to get session ID from cookies:', error);
      return null;
    }
  }

  /**
   * @deprecated Use getSessionIdFromCookies + getGuestSession server action instead
   */
  static getSessionFromCookies(cookieHeader?: string): GuestSession | null {
    console.warn('getSessionFromCookies is deprecated. Use getSessionIdFromCookies + getGuestSession server action.');
    return null;
  }

  /**
   * @deprecated Use getSessionIdFromCookies + getGuestSession server action instead
   */
  static getSessionByIdFromCookies(sessionId: string, cookieHeader?: string): GuestSession | null {
    console.warn('getSessionByIdFromCookies is deprecated. Use getSessionIdFromCookies + getGuestSession server action.');
    return null;
  }
}
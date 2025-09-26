// Guest session storage utilities

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

const GUEST_SESSION_KEY = 'matchbook_guest_session';

export class GuestSessionService {
  static storeSession(session: GuestSession): boolean {
    try {
      if (typeof window === 'undefined') return false;

      // Convert dates to ISO strings for storage
      const sessionForStorage = {
        ...session,
        searchParams: {
          ...session.searchParams,
          startDate: session.searchParams.startDate?.toISOString(),
          endDate: session.searchParams.endDate?.toISOString(),
        },
      };

      const sessionJson = JSON.stringify(sessionForStorage);

      // Store in sessionStorage for client-side persistence
      sessionStorage.setItem(GUEST_SESSION_KEY, sessionJson);

      // ALSO store in cookie for server-side access
      const maxAge = 24 * 60 * 60; // 24 hours in seconds
      document.cookie = `${GUEST_SESSION_KEY}=${encodeURIComponent(sessionJson)}; path=/; max-age=${maxAge}; SameSite=Lax`;

      return true;
    } catch (error) {
      console.error('Failed to store guest session:', error);
      return false;
    }
  }

  static getSession(): GuestSession | null {
    try {
      if (typeof window === 'undefined') return null;

      const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Convert date strings back to Date objects
      return {
        ...session,
        searchParams: {
          ...session.searchParams,
          startDate: session.searchParams.startDate ? new Date(session.searchParams.startDate) : undefined,
          endDate: session.searchParams.endDate ? new Date(session.searchParams.endDate) : undefined,
        },
      };
    } catch (error) {
      console.error('Failed to get guest session:', error);
      this.clearSession(); // Clear corrupted session
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
        sessionStorage.removeItem(GUEST_SESSION_KEY);
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

  // Server-side method to read session from cookies
  static getSessionFromCookies(cookieHeader?: string): GuestSession | null {
    try {
      if (!cookieHeader) return null;

      // Parse cookies
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const sessionCookie = cookies[GUEST_SESSION_KEY];
      if (!sessionCookie) return null;

      const sessionJson = decodeURIComponent(sessionCookie);
      const session = JSON.parse(sessionJson);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        return null;
      }

      // Convert date strings back to Date objects
      return {
        ...session,
        searchParams: {
          ...session.searchParams,
          startDate: session.searchParams.startDate ? new Date(session.searchParams.startDate) : undefined,
          endDate: session.searchParams.endDate ? new Date(session.searchParams.endDate) : undefined,
        },
      };
    } catch (error) {
      console.error('Failed to get guest session from cookies:', error);
      return null;
    }
  }

  static getSessionByIdFromCookies(sessionId: string, cookieHeader?: string): GuestSession | null {
    const session = this.getSessionFromCookies(cookieHeader);
    return session?.id === sessionId ? session : null;
  }
}
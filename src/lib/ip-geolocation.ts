import { headers } from 'next/headers';

export interface IpLocation {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Get user's approximate location from IP address using Vercel/Cloudflare headers
 * Returns null if location data is not available
 */
export async function getIpLocation(): Promise<IpLocation | null> {
  try {
    const headersList = await headers();
    
    // Get coordinates from Vercel or Cloudflare headers
    const latStr = headersList.get('x-vercel-ip-latitude') || headersList.get('cf-iplatitude');
    const lngStr = headersList.get('x-vercel-ip-longitude') || headersList.get('cf-iplongitude');
    
    // Log available geo headers for debugging
    console.log('[IP Geolocation] Headers:', {
      vercel: {
        lat: headersList.get('x-vercel-ip-latitude'),
        lng: headersList.get('x-vercel-ip-longitude'),
        city: headersList.get('x-vercel-ip-city'),
        region: headersList.get('x-vercel-ip-country-region'),
        country: headersList.get('x-vercel-ip-country'),
      },
      cloudflare: {
        lat: headersList.get('cf-iplatitude'),
        lng: headersList.get('cf-iplongitude'),
        city: headersList.get('cf-ipcity'),
        region: headersList.get('cf-region'),
        country: headersList.get('cf-ipcountry'),
      }
    });
    
    if (!latStr || !lngStr) {
      console.log('[IP Geolocation] No coordinates found in headers');
      return null;
    }
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.log('[IP Geolocation] Invalid coordinates:', { latStr, lngStr });
      return null;
    }
    
    // Also get city/region/country if available
    const city = headersList.get('x-vercel-ip-city') || headersList.get('cf-ipcity') || undefined;
    const region = headersList.get('x-vercel-ip-country-region') || headersList.get('cf-region') || undefined;
    const country = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || undefined;
    
    console.log('[IP Geolocation] Resolved location:', { lat, lng, city, region, country });
    
    return {
      lat,
      lng,
      city,
      region,
      country,
    };
  } catch (error) {
    console.error('[IP Geolocation] Error getting IP location:', error);
    return null;
  }
}

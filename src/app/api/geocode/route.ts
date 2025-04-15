// TypeScript interfaces for Google Geocode API response
export interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

export interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: Geometry;
  navigation_points?: NavigationPoint[];
  place_id: string;
  types: string[];
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface Geometry {
  location: LatLngLiteral;
  location_type: string;
  viewport: Viewport;
  bounds?: Viewport;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface Viewport {
  northeast: LatLngLiteral;
  southwest: LatLngLiteral;
}

export interface NavigationPoint {
  lat: number;
  lng: number;
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as GeocodeResponse;
    console.log("Geocode response:", data.results[0].address_components);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching geocode' }, { status: 500 });
  }
}
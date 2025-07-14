import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const types = searchParams.get('types');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!input) {
    return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 });
  }

  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&components=country:us&key=${apiKey}`;
  
  // Add types parameter if specified
  if (types) {
    url += `&types=${types}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching suggestions' }, { status: 500 });
  }
}

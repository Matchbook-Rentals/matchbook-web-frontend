import { NextResponse } from 'next/server';
import { digitalOceanSpaces } from '@/lib/digitalocean-spaces';

// GET /api/pdf-templates/test - Test DigitalOcean Spaces connection
export async function GET() {
  try {
    const isConnected = await digitalOceanSpaces.testConnection();
    
    return NextResponse.json({ 
      connected: isConnected,
      message: isConnected ? 'Successfully connected to DigitalOcean Spaces' : 'Failed to connect to DigitalOcean Spaces',
      config: {
        endpoint: process.env.DIGITALOCEAN_SPACES_ENDPOINT,
        bucket: process.env.DIGITALOCEAN_SPACES_BUCKET,
        hasCredentials: !!(process.env.DIGITALOCEAN_SPACES_KEY && process.env.DIGITALOCEAN_SPACES_SECRET),
      }
    });
  } catch (error) {
    console.error('Error testing DigitalOcean Spaces connection:', error);
    return NextResponse.json(
      { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {
          endpoint: process.env.DIGITALOCEAN_SPACES_ENDPOINT,
          bucket: process.env.DIGITALOCEAN_SPACES_BUCKET,
          hasCredentials: !!(process.env.DIGITALOCEAN_SPACES_KEY && process.env.DIGITALOCEAN_SPACES_SECRET),
        }
      },
      { status: 500 }
    );
  }
}
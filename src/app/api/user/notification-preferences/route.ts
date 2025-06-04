import { NextRequest, NextResponse } from 'next/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/app/actions/user';

export async function GET() {
  try {
    const result = await getNotificationPreferences();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in notification preferences GET route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();
    const result = await updateNotificationPreferences(preferences);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in notification preferences POST route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
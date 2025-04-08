import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function GET(req: Request) {
  try {
    // Get the URL for query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const userId = url.searchParams.get('userId');
    
    // Get the authenticated user
    const { userId: clerkUserId } = auth();
    
    // If no userId was specified in the query, use the authenticated user
    const targetUserId = userId || clerkUserId;
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Build query based on parameters
    const query: any = {
      where: { userId: targetUserId }
    };
    
    // Add type filter if specified
    if (type) {
      query.where.type = type;
    }
    
    // Fetch purchases from database
    const purchases = await prismadb.purchase.findMany({
      ...query,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ purchases });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
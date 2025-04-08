import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { type, sessionId } = body;
    
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    
    // Build the query to find the right purchase
    const query: any = {
      userId,
      type,
      isRedeemed: false
    };
    
    // If a session ID is provided, look for purchases with that session ID in metadata
    let purchase = null;
    
    if (sessionId) {
      // First try to find the purchase with the exact session ID
      const purchases = await prismadb.purchase.findMany({
        where: query
      });
      
      // Search through purchases for matching session ID in metadata
      for (const p of purchases) {
        try {
          if (p.metadata) {
            const metadata = JSON.parse(p.metadata as string);
            if (metadata.sessionId === sessionId) {
              purchase = p;
              break;
            }
          }
        } catch (error) {
          console.error('Error parsing purchase metadata:', error);
        }
      }
    }
    
    // If no purchase was found with the session ID, fall back to the first matching purchase
    if (!purchase) {
      purchase = await prismadb.purchase.findFirst({
        where: query
      });
    }
    
    if (!purchase) {
      return NextResponse.json({ error: 'No unredeemed purchase found' }, { status: 404 });
    }
    
    // Mark the purchase as redeemed
    const updatedPurchase = await prismadb.purchase.update({
      where: { id: purchase.id },
      data: { isRedeemed: true }
    });
    
    return NextResponse.json({ success: true, purchase: updatedPurchase });
  } catch (error: any) {
    console.error('Error redeeming purchase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
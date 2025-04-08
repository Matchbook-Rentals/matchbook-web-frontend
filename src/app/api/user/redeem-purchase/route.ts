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
    const { type } = body;
    
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    
    // Find the first unredeemed purchase of the specified type
    const purchase = await prismadb.purchase.findFirst({
      where: {
        userId,
        type,
        isRedeemed: false
      }
    });
    
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
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getReceiptWithItems } from '@/lib/receipt-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { receiptId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receipt = await getReceiptWithItems(params.receiptId);

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Check if user owns this receipt
    if (receipt.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(receipt);

  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
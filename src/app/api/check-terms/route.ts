import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`[API CHECK-TERMS] Checking terms for user: ${userId}`);

    const user = await prismadb.user.findUnique({
      where: { id: userId },
      select: { agreedToTerms: true }
    });

    const hasAgreedToTerms = !!user?.agreedToTerms;
    console.log(`[API CHECK-TERMS] User has agreed to terms: ${hasAgreedToTerms}`);

    return NextResponse.json({ hasAgreedToTerms });
  } catch (error) {
    console.error('[API CHECK-TERMS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
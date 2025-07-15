import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }


    const user = await prismadb.user.findUnique({
      where: { id: userId },
      select: { agreedToTerms: true }
    });

    const hasAgreedToTerms = !!user?.agreedToTerms;

    return NextResponse.json({ hasAgreedToTerms });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
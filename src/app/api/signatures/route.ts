import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// GET /api/signatures - Get user's saved signatures
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signatures = await prisma.userSignature.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default signatures first
        { createdAt: 'desc' },  // Then newest first
      ],
    });

    return NextResponse.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}

// POST /api/signatures - Save new signature
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, fontFamily, setAsDefault } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    if (!['drawn', 'typed'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "drawn" or "typed"' },
        { status: 400 }
      );
    }

    // Validate data size (limit to 1MB for drawn signatures)
    if (type === 'drawn' && data.length > 1024 * 1024) {
      return NextResponse.json(
        { error: 'Signature image too large' },
        { status: 400 }
      );
    }

    // If setting as default, remove default flag from other signatures
    if (setAsDefault) {
      await prisma.userSignature.updateMany({
        where: {
          userId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const signature = await prisma.userSignature.create({
      data: {
        userId: userId,
        type: type,
        data: data,
        fontFamily: fontFamily || null,
        isDefault: setAsDefault || false,
      },
    });

    return NextResponse.json(signature, { status: 201 });
  } catch (error) {
    console.error('Error creating signature:', error);
    return NextResponse.json(
      { error: 'Failed to create signature' },
      { status: 500 }
    );
  }
}
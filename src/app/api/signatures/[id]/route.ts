import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// PATCH /api/signatures/[id] - Update signature (mainly for setting default)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isDefault } = body;

    // Verify the signature belongs to the user
    const existingSignature = await prisma.userSignature.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingSignature) {
      return NextResponse.json(
        { error: 'Signature not found' },
        { status: 404 }
      );
    }

    // If setting as default, remove default flag from other signatures
    if (isDefault) {
      await prisma.userSignature.updateMany({
        where: {
          userId: userId,
          isDefault: true,
          id: { not: id }, // Don't update the current signature
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedSignature = await prisma.userSignature.update({
      where: {
        id: id,
      },
      data: {
        isDefault: isDefault,
      },
    });

    return NextResponse.json(updatedSignature);
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json(
      { error: 'Failed to update signature' },
      { status: 500 }
    );
  }
}

// DELETE /api/signatures/[id] - Delete signature
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the signature belongs to the user
    const existingSignature = await prisma.userSignature.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingSignature) {
      return NextResponse.json(
        { error: 'Signature not found' },
        { status: 404 }
      );
    }

    await prisma.userSignature.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Error deleting signature:', error);
    return NextResponse.json(
      { error: 'Failed to delete signature' },
      { status: 500 }
    );
  }
}
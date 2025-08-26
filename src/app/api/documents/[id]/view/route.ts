import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    // Get the document to access the PDF file
    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId },
      include: {
        template: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access (either owns it or is a recipient)
    const hasAccess = document.userId === userId || 
      (document.documentData as any)?.recipients?.some((r: any) => r.email === userId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Redirect to the PDF file URL
    return NextResponse.redirect(document.pdfFileUrl);
    
  } catch (error) {
    console.error('Error viewing document:', error);
    return NextResponse.json(
      { error: 'Failed to view document' },
      { status: 500 }
    );
  }
}
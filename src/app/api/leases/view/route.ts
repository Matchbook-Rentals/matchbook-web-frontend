import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { documentApi } from '@/lib/boldsign-client';
import prisma from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    console.log('📄 Fetching document for viewing:', documentId);

    // Verify user has access to this document
    const boldSignLease = await prisma.boldSignLease.findUnique({
      where: { id: documentId },
      include: { 
        match: {
          include: {
            trip: {
              include: { user: true }
            },
            listing: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!boldSignLease) {
      console.error('❌ Document not found:', documentId);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access (landlord or tenant)
    const isLandlord = boldSignLease.match?.listing.user?.id === userId;
    const isTenant = boldSignLease.match?.trip.user?.id === userId;
    
    if (!isLandlord && !isTenant) {
      console.error('❌ Access denied for user:', userId);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('✅ User authorized to view document');

    try {
      // Download the document from BoldSign
      console.log('📥 Downloading document from BoldSign...');
      const documentBuffer = await documentApi.downloadDocument(documentId);
      
      if (!documentBuffer) {
        throw new Error('No document buffer received from BoldSign');
      }

      console.log('✅ Document downloaded successfully, size:', documentBuffer.length);

      // Return the PDF with appropriate headers
      return new NextResponse(documentBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="lease-agreement-${documentId}.pdf"`,
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          'X-Content-Type-Options': 'nosniff',
        }
      });
    } catch (downloadError) {
      console.error('❌ Error downloading from BoldSign:', downloadError);
      
      // If download fails, try to provide the embedUrl as fallback
      if (boldSignLease.embedUrl) {
        console.log('🔄 Redirecting to embedUrl as fallback');
        return NextResponse.redirect(boldSignLease.embedUrl);
      }
      
      throw downloadError;
    }
  } catch (error) {
    console.error('❌ Error in lease view endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
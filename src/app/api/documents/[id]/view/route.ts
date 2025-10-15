import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { exportPDFWithFields, sanitizePDF } from '@/lib/pdfExporter';

// GET /api/documents/[id]/view - View/download document PDF with annotations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    // Check if this is a download request
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the document with all relations
    const document = await prisma.documentInstance.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        signingSessions: true,
        fieldValues: true,
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access (owner or recipient)
    let hasAccess = document.userId === userId;
    
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (user?.email) {
        const documentData = document.documentData as any;
        const recipients = documentData?.recipients || [];
        hasAccess = recipients.some((r: any) => r.email === user.email);
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the PDF content from the document
    const documentData = document.documentData as any;
    
    // First, try to get the base PDF data
    let basePdfBuffer: ArrayBuffer | null = null;
    
    // Check if there's a pdfFileUrl field
    if ((document as any).pdfFileUrl) {
      const pdfUrl = (document as any).pdfFileUrl;
      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        try {
          const pdfResponse = await fetch(pdfUrl);
          if (pdfResponse.ok) {
            basePdfBuffer = await pdfResponse.arrayBuffer();
          }
        } catch (error) {
          console.error('Error fetching PDF from URL:', error);
        }
      }
    }
    
    // If no URL, check for base64 PDF data
    if (!basePdfBuffer) {
      let pdfData: string | null = null;
      
      if (documentData?.pdfBase64) {
        pdfData = documentData.pdfBase64;
      } else if (documentData?.pdfData) {
        pdfData = documentData.pdfData;
      } else if (documentData?.fileData) {
        pdfData = documentData.fileData;
      }
      
      if (pdfData) {
        try {
          // Remove data URL prefix if present
          const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, '');
          basePdfBuffer = Buffer.from(base64Data, 'base64');
        } catch (error) {
          console.error('Error processing base64 PDF data:', error);
        }
      }
    }
    
    // If we have the base PDF, check if we need to apply annotations
    if (basePdfBuffer) {
      try {
        // Check if there are field values to apply
        const hasFieldValues = document.fieldValues && document.fieldValues.length > 0;
        const templateData = document.template?.templateData as any;
        const hasTemplateFields = templateData?.fields && templateData.fields.length > 0;
        
        if (hasFieldValues && hasTemplateFields) {
          console.log('Applying annotations to PDF:', {
            fieldCount: templateData.fields.length,
            valueCount: document.fieldValues.length
          });
          
          // Convert field values to a lookup object
          const signedValues: Record<string, any> = {};
          for (const fieldValue of document.fieldValues) {
            signedValues[fieldValue.fieldId] = fieldValue.value;
          }
          
          // Apply annotations using pdf-lib with security options
          const annotatedPdf = await exportPDFWithFields(
            basePdfBuffer,
            templateData.fields,
            templateData.recipients || [],
            signedValues,
            {
              showFieldBorders: false, // Don't show borders in final PDF
              includeLabels: true,     // Include the field values
              fieldOpacity: 1.0,       // Full opacity
              flatten: true,           // Flatten form fields (make non-editable)
              removeLinks: true        // Remove all hyperlinks and external references
            }
          );
          
          return new NextResponse(annotatedPdf, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="lease-agreement-${params.id}.pdf"`,
              'Cache-Control': 'private, max-age=3600'
            }
          });
        } else {
          // No annotations to apply, but still sanitize the PDF
          console.log('No annotations to apply, sanitizing base PDF');

          const sanitizedPdf = await sanitizePDF(basePdfBuffer, {
            flatten: true,
            removeLinks: true
          });

          return new NextResponse(sanitizedPdf, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="lease-agreement-${params.id}.pdf"`,
              'Cache-Control': 'private, max-age=3600'
            }
          });
        }
      } catch (error) {
        console.error('Error applying annotations:', error);
        // If annotation fails, still try to sanitize before returning
        try {
          const sanitizedPdf = await sanitizePDF(basePdfBuffer, {
            flatten: true,
            removeLinks: true
          });

          return new NextResponse(sanitizedPdf, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="lease-agreement-${params.id}.pdf"`,
              'Cache-Control': 'private, max-age=3600'
            }
          });
        } catch (sanitizeError) {
          console.error('Error sanitizing PDF:', sanitizeError);
          // Last resort: return unsanitized PDF
          return new NextResponse(basePdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="lease-agreement-${params.id}.pdf"`,
              'Cache-Control': 'private, max-age=3600'
            }
          });
        }
      }
    }

    // Check if this is a lease document that might have additional data
    const match = await prisma.match.findFirst({
      where: { leaseDocumentId: params.id },
      include: { 
        BoldSignLease: true,
        listing: true,
        trip: true
      }
    });

    if (match) {
      // Log what we found for debugging
      console.log('Found match for lease document:', {
        matchId: match.id,
        hasBoldSignLease: !!match.BoldSignLease,
        documentDataKeys: Object.keys(documentData || {})
      });
    }

    // If no PDF data found, return an error
    return NextResponse.json({ 
      error: 'Document PDF not available. The document may still be processing or requires regeneration.',
      details: 'No PDF data found in document instance'
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error viewing document:', error);
    return NextResponse.json(
      { error: 'Failed to load document' },
      { status: 500 }
    );
  }
}
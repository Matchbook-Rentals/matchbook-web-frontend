import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// POST /api/field-values - Save signed field value
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, fieldId, fieldType, signerIndex, signerEmail, value } = body;

    if (!documentId || !fieldId || !fieldType || signerIndex === undefined || !signerEmail || value === undefined) {
      return NextResponse.json({ 
        error: 'All field data is required' 
      }, { status: 400 });
    }

    // Verify user has access to the document (either owns it or is a recipient)
    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user owns the document
    if (document.userId === userId) {
      // User owns the document, allow access
    } else {
      // Check if user is a recipient
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user?.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 404 });
      }

      // Check if user's email is in the recipients array
      const documentData = document.documentData as any;
      const recipients = documentData?.recipients || [];
      const isRecipient = recipients.some((r: any) => r.email === user.email);

      if (!isRecipient) {
        return NextResponse.json({ error: 'Access denied - not a document owner or recipient' }, { status: 403 });
      }
    }

    // Create or update field value (upsert)
    const fieldValue = await prisma.fieldValue.upsert({
      where: {
        documentId_fieldId: {
          documentId,
          fieldId
        }
      },
      update: {
        value,
        signedAt: new Date()
      },
      create: {
        documentId,
        fieldId,
        fieldType,
        signerIndex,
        signerEmail,
        value
      }
    });

    return NextResponse.json({ fieldValue }, { status: 201 });

  } catch (error) {
    console.error('Error saving field value:', error);
    return NextResponse.json(
      { error: 'Failed to save field value' },
      { status: 500 }
    );
  }
}

// DELETE /api/field-values - Clear a signed field value. Allowed before the
// booking is created; once a booking exists for the match linked to this
// document, the lease is effectively locked and clears are rejected.
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, fieldId } = body;

    if (!documentId || !fieldId) {
      return NextResponse.json({ error: 'documentId and fieldId are required' }, { status: 400 });
    }

    const document = await prisma.documentInstance.findUnique({
      where: { id: documentId },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Access check: owner or recipient (mirrors POST)
    let hasAccess = document.userId === userId;
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        const docData = document.documentData as any;
        const recipients = docData?.recipients || [];
        hasAccess = recipients.some((r: any) => r.email === user.email);
      }
    }
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Guard: if the match linked to this document already has a booking,
    // the lease is locked.
    const match = await prisma.match.findFirst({
      where: { leaseDocumentId: documentId },
      include: { booking: { select: { id: true } } },
    });
    if (match?.booking) {
      return NextResponse.json(
        { error: 'Lease is locked: booking already created for this match' },
        { status: 409 },
      );
    }

    // Drop the FieldValue row (if present).
    await prisma.fieldValue.deleteMany({
      where: { documentId, fieldId },
    });

    // Strip value/signedAt/signerIndex from the matching field in
    // documentData.fields so reload doesn't re-seed the baked value.
    const docData = (document.documentData as any) ?? {};
    const fields: any[] = Array.isArray(docData.fields) ? docData.fields : [];
    let stripped = false;
    const newFields = fields.map((f: any) => {
      if (f?.formId !== fieldId) return f;
      stripped = true;
      const { value, signedAt, signerIndex, ...rest } = f;
      return rest;
    });

    if (stripped) {
      await prisma.documentInstance.update({
        where: { id: documentId },
        data: { documentData: { ...docData, fields: newFields } },
      });
    }

    return NextResponse.json({ success: true, strippedFromDocumentData: stripped });
  } catch (error) {
    console.error('Error clearing field value:', error);
    return NextResponse.json(
      { error: 'Failed to clear field value' },
      { status: 500 }
    );
  }
}
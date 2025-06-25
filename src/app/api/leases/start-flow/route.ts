
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prismadb'
import { documentApi, handleBoldSignError } from '@/lib/boldsign-client';

export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('Start flow request body:', body);

    // First try to find BoldSignLease by documentId
    let match;
    const boldSignLease = await prisma?.boldSignLease.findUnique({
      where: { id: body.documentId },
      include: {
        match: {
          include: {
            trip: {
              include: {
                user: true
              }
            },
            listing: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (boldSignLease && boldSignLease.match) {
      match = boldSignLease.match;
    } else {
      // If no BoldSignLease found, try to find match by leaseDocumentId
      match = await prisma?.match.findFirst({
        where: { leaseDocumentId: body.documentId },
        include: {
          trip: {
            include: {
              user: true
            }
          },
          listing: {
            include: {
              user: true
            }
          }
        }
      });

      if (!match) {
        throw new Error('No lease or match found for this document');
      }
    }

    const tenant = match.trip.user;
    const landlord = match.listing.user;

    // Instead of creating a new document, get the embed URL for the existing one
    try {
      console.log('BoldSign embed request:', {
        documentId: body.documentId,
        signerEmail: body.signerEmail
      });

      const embedResult = await documentApi.getEmbeddedSignLink(body.documentId, body.signerEmail);
      console.log('BoldSign embed result:', embedResult);

      return NextResponse.json({ embedUrl: embedResult.signLink });
    } catch (error) {
      handleBoldSignError(error, 'getEmbeddedSignLink');
    }
  } catch (error) {
    console.error('Error creating document from template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}




function formatDate(dateString: Date | string) {
  console.log(dateString);
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based in JavaScript
  const year = date.getFullYear();

  const newDate = `${month}/${day}/${year}`
  console.log(newDate);
  return newDate;
}


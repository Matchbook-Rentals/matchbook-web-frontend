import { NextRequest, NextResponse } from 'next/server';
import { updateHousingRequest } from '@/app/actions/housing-requests';
import { updateMatch, getMatch } from '@/app/actions/matches';

export async function DELETE(request: NextRequest) {
  try {
    const { housingRequestId, documentId } = await request.json();

    if (!housingRequestId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Housing request ID and document ID are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SIGNNOW_API_KEY;
    if (!apiKey) {
      console.error('SIGNNOW_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'SignNow API key not configured' },
        { status: 500 }
      );
    }

    // Delete the document from SignNow
    const deleteResponse = await fetch(`https://api.signnow.com/document/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('SignNow delete error:', errorText);
      // Continue anyway to clean up our database
    }

    // Clear the leaseDocumentId from the housing request
    const updateResult = await updateHousingRequest(housingRequestId, {
      leaseDocumentId: null,
    });

    if (!updateResult.success) {
      console.error('Failed to update housing request:', updateResult.error);
    }

    // Also clear from match if it exists
    try {
      const matchResult = await getMatch(housingRequestId);
      if (matchResult.success && matchResult.match) {
        await updateMatch(matchResult.match.id, {
          leaseDocumentId: null,
        });
      }
    } catch (error) {
      console.error('Error updating match with lease document ID:', error);
      // Don't fail the whole operation if match update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Lease document removed successfully',
    });

  } catch (error) {
    console.error('Error in delete-document API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
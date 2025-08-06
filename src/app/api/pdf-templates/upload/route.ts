import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

// POST /api/pdf-templates/upload - Upload a PDF file to UploadThing
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Upload to UploadThing
    const response = await utapi.uploadFiles(file);
    
    if (!response || response.error) {
      throw new Error(response?.error?.message || 'Upload failed');
    }

    return NextResponse.json({
      success: true,
      fileKey: response.data.key,
      fileUrl: response.data.url,
      fileName: response.data.name,
      fileSize: response.data.size,
    });

  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to upload PDF file' },
      { status: 500 }
    );
  }
}
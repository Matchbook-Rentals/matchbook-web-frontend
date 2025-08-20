import { NextRequest, NextResponse } from 'next/server';
import { pdfTemplateService } from '@/lib/pdf-template-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/pdf-templates - List user's templates
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('q');
    const listingId = searchParams.get('listingId');

    // Handle search vs list
    if (query) {
      const templates = await pdfTemplateService.searchTemplates(userId, query, limit);
      return NextResponse.json({ templates, total: templates.length });
    } else {
      const result = await pdfTemplateService.listTemplates(userId, limit, offset, listingId || undefined);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/pdf-templates - Create a new template
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

    const body = await request.json();
    const { 
      title, 
      description,
      type,
      listingId,
      fields, 
      recipients, 
      pdfFileUrl,
      pdfFileName,
      pdfFileSize,
      pdfFileKey,
      author,
      subject 
    } = body;

    // Validate required fields
    if (!title || !fields || !recipients || !pdfFileUrl || !pdfFileKey) {
      return NextResponse.json(
        { error: 'Missing required fields: title, fields, recipients, pdfFileUrl, pdfFileKey' },
        { status: 400 }
      );
    }

    // Create template data structure
    const templateData = {
      fields,
      recipients,
      metadata: {
        author: author || 'PDF Editor User',
        subject: subject || 'PDF Template',
        createdWith: 'PDF Editor v1.0',
      },
    };

    // Save to database
    const template = await pdfTemplateService.createTemplate({
      title,
      description,
      type: type || 'lease',
      listingId,
      templateData,
      pdfFileUrl,
      pdfFileName: pdfFileName || 'document.pdf',
      pdfFileSize: pdfFileSize || 0,
      pdfFileKey,
      userId,
    });
    
    return NextResponse.json({ 
      success: true, 
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { pdfTemplateService } from '@/lib/pdf-template-service';
import { digitalOceanSpaces } from '@/lib/digitalocean-spaces';
import { auth } from '@clerk/nextjs/server';

// GET /api/pdf-templates/[id] - Load a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const template = await pdfTemplateService.getTemplate(params.id, userId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error loading template:', error);
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    );
  }
}

// DELETE /api/pdf-templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get template to retrieve file key for deletion from Spaces
    const template = await pdfTemplateService.getTemplate(params.id, userId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete from database first
    await pdfTemplateService.deleteTemplate(params.id, userId);

    // Then delete PDF file from DigitalOcean Spaces
    try {
      await digitalOceanSpaces.deletePdf(template.pdfFileKey);
    } catch (spacesError) {
      console.warn('Warning: Failed to delete PDF file from Spaces:', spacesError);
      // Don't fail the entire operation if Spaces deletion fails
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

// PUT /api/pdf-templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { title, description, fields, recipients, author, subject } = body;

    if (!title && !description && !fields && !recipients) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Prepare template data if fields/recipients are being updated
    let templateData = undefined;
    if (fields || recipients) {
      // Get existing template to merge data
      const existingTemplate = await pdfTemplateService.getTemplate(params.id, userId);
      if (!existingTemplate) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      const existingData = existingTemplate.templateData as any;
      templateData = {
        fields: fields || existingData.fields,
        recipients: recipients || existingData.recipients,
        metadata: {
          ...existingData.metadata,
          ...(author && { author }),
          ...(subject && { subject }),
        },
      };
    }

    const updatedTemplate = await pdfTemplateService.updateTemplate(params.id, userId, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(templateData && { templateData }),
    });
    
    return NextResponse.json({ 
      success: true, 
      template: {
        id: updatedTemplate.id,
        title: updatedTemplate.title,
        description: updatedTemplate.description,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
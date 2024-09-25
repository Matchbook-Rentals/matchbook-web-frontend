
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  console.log('Received webhook request from BoldSign');
  try {
    const body = await req.json();

    if (body.event.eventType !== 'TemplateCreated') {
      return NextResponse.json({ message: 'Unsupported event type' }, { status: 400 });
    }

    const { templateId, templateName, templateDescription } = body.data;

    console.log('Processing template creation:', { templateId, templateName, templateDescription });

    const boldSignTemplate = await prisma.boldSignTemplate.create({
      data: {
        id: templateId,
        templateName: templateName || null,
        templateDescription: templateDescription || null,
      },
    });

    console.log('Template created successfully:', boldSignTemplate);

    return NextResponse.json({ message: 'Template created successfully', template: boldSignTemplate }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

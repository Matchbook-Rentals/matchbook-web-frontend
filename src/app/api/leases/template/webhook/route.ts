
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const startTime = Date.now();

  console.log('🔔 [Lease Template Webhook] Received webhook request from BoldSign');

  try {
    const body = await req.json();

    console.log('📦 [Lease Template Webhook] Full payload:', JSON.stringify(body, null, 2));
    console.log('🏷️ [Lease Template Webhook] Event type:', body.event?.eventType);

    if (body.event.eventType !== 'TemplateCreated') {
      console.warn('⚠️ [Lease Template Webhook] Unsupported event type:', body.event.eventType);
      return NextResponse.json({ message: 'Unsupported event type' }, { status: 400 });
    }

    const { templateId, templateName, templateDescription } = body.data;

    console.log('📋 [Lease Template Webhook] Processing template creation:', {
      templateId,
      templateName,
      templateDescription
    });

    console.log('💾 [Lease Template Webhook] Creating BoldSignTemplate in database...');
    const boldSignTemplate = await prisma.boldSignTemplate.create({
      data: {
        id: templateId,
        templateName: templateName || null,
        templateDescription: templateDescription || null,
      },
    });

    console.log('✅ [Lease Template Webhook] Template created successfully:', boldSignTemplate);

    const processingTime = Date.now() - startTime;
    console.log('✅ [Lease Template Webhook] Webhook processed successfully');
    console.log('⏱️ [Lease Template Webhook] Processing time:', processingTime, 'ms');

    return NextResponse.json({ message: 'Template created successfully', template: boldSignTemplate }, { status: 200 });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [Lease Template Webhook] Error processing webhook:', error);
    console.error('   Error type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('⏱️ [Lease Template Webhook] Failed after:', processingTime, 'ms');

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

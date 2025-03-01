import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('docxFile') as File;
  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // Convert HTML to Markdown using turndown
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);

    return new NextResponse(markdown, { status: 200 });
  } catch (error: any) {
    console.error('Error converting DOCX:', error);
    return new NextResponse('Conversion error', { status: 500 });
  }
}
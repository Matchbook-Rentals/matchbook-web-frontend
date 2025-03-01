import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('docxFile') as File;
  if (!file) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  try {
    // Save file to a temporary directory
    const tempDir = tmpdir();
    const randomName = randomBytes(16).toString('hex');
    const tempFilePath = join(tempDir, `${randomName}.docx`);

    const buffer = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, buffer);

    // Use pandoc to convert DOCX to Markdown
    const markdown = await new Promise<string>((resolve, reject) => {
      exec(`pandoc "${tempFilePath}" -f docx -t markdown`, (error, stdout, stderr) => {
        // Clean up temporary file
        fs.unlink(tempFilePath);
        if (error) {
          console.error('Pandoc conversion error:', stderr);
          return reject(new Error('Conversion failed'));
        }
        resolve(stdout);
      });
    });

    return new NextResponse(markdown, { status: 200 });
  } catch (error: any) {
    console.error('Error converting DOCX:', error);
    return new NextResponse('Conversion error', { status: 500 });
  }
}
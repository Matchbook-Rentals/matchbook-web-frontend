import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execPromise = promisify(exec);

/* Declare tempFilePath before try block */
let tempFilePath: string = '';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('docxFile');
    if (!file || !(file instanceof File)) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Write the uploaded file to a temporary location
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `upload-${Date.now()}.docx`);
    const fileArrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(fileArrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    // Run pandoc to convert DOCX to Markdown
    const { stdout, stderr } = await execPromise(`pandoc "${tempFilePath}" -f docx -t markdown`);
    if (stderr) {
      console.error(stderr);
    }

    return new NextResponse(stdout, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse('Conversion failed', { status: 500 });
  } finally {
    // Cleanup temporary file if it exists
    try {
      if (tempFilePath) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
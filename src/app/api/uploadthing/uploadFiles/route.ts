// Server-side file upload handler using UploadThing
import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import client from '@/lib/prismadb';

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll('files');
    // Only keep File entries
    const files = rawFiles.filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      console.error('[uploadFiles API] No valid File entries found');
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    console.log(`[uploadFiles API] Received ${files.length} file(s)`);
    console.log('[uploadFiles API] Files metadata:', files.map(f => ({ name: f.name, type: f.type })));

    const result = await utapi.uploadFiles(files);
    console.log('[uploadFiles API] Raw response:', JSON.stringify(result, null, 2));

    const responses = Array.isArray(result) ? result : [result];
    const errors = responses.filter(r => r.error);
    if (errors.length > 0) {
      console.error('[uploadFiles API] Upload errors:', JSON.stringify(errors, null, 2));
      return NextResponse.json({ error: 'Some files failed to upload', details: errors }, { status: 400 });
    }

    const uploaded = responses.map(r => r.data!);
    console.log(`[uploadFiles API] Successfully uploaded ${uploaded.length} file(s)`);

    // Save file metadata to database
    for (const upload of uploaded) {
      try {
        await client.uploadedFile.create({
          data: {
            key: upload.key,
            url: upload.url,
            router: 'custom',
            userId: null, // Custom route may not have userId; adjust as needed
            uploadedAt: new Date(),
            size: upload.size,
            name: upload.name,
          }
        });
      } catch (dbError) {
        console.error(`[uploadFiles API] Failed to save ${upload.key} to database:`, dbError);
      }
    }

    return NextResponse.json(uploaded, { status: 200 });
  } catch (err: any) {
    console.error('[uploadFiles API] Exception:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Upload exception', details: message }, { status: 500 });
  }
}

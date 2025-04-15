import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// get handler that pulls a query param called fileURL
export async function GET(req: NextRequest) {
  const fileURL = req.nextUrl.searchParams.get("fileURL");
  if (!fileURL) {
    console.error("Bad request: No file URL provided");
    return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
  }
  try {
    const uploadedFile = await utapi.uploadFilesFromUrl(fileURL);
    if (!uploadedFile || uploadedFile.error) {
      console.error("Upload failed", uploadedFile);
      return NextResponse.json({ error: "Upload failed", details: uploadedFile?.error || null }, { status: 400 });
    }
    console.log("Upload successful", uploadedFile);
    return NextResponse.json(uploadedFile, { status: 200 });
  } catch (err) {
    console.error("Upload exception", err);
    return NextResponse.json({ error: "Upload failed", details: err instanceof Error ? err.message : err }, { status: 400 });
  }
}

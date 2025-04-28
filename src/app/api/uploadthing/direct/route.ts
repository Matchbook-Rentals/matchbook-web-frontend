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

  console.log(`[Upload API] Received request for fileURL: ${fileURL}`);

  try {
    const uploadedFile = await utapi.uploadFilesFromUrl(fileURL);

    // Log the raw response regardless of success/failure for debugging
    console.log("[Upload API] Raw response from utapi.uploadFilesFromUrl:", JSON.stringify(uploadedFile, null, 2));

    if (!uploadedFile || uploadedFile.error) {
      console.error("[Upload API] Upload failed. Full response:", JSON.stringify(uploadedFile, null, 2));
      return NextResponse.json({ error: "Upload failed", details: uploadedFile?.error || "Unknown UploadThing error" }, { status: 400 });
    }

    console.log("[Upload API] Upload successful:", JSON.stringify(uploadedFile, null, 2));
    // Assuming success if we reach here without error
    return NextResponse.json(uploadedFile, { status: 200 });
  } catch (err) {
    console.error("[Upload API] Upload exception caught:", err);
    // Log the full error structure if possible
    console.error("[Upload API] Full error object:", JSON.stringify(err, null, 2));
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Upload failed due to exception", details: errorMessage }, { status: 500 }); // Use 500 for server-side exceptions
  }
}

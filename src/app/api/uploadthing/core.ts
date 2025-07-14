import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import client from '@/lib/prismadb';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 40 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      // Save file metadata to database
      try {
        await client.uploadedFile.create({
          data: {
            key: file.key,
            url: file.url,
            router: 'imageUploader',
            userId: metadata.userId,
            uploadedAt: new Date(),
            size: file.size,
            name: file.name,
          }
        });
        console.log("Upload complete for userId:", metadata.userId, "- Saved file metadata to database");
      } catch (dbError) {
        console.error("Upload complete for userId:", metadata.userId, "- Failed to save to database:", dbError);
        // Don't throw; let upload succeed but log error
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  listingUploadPhotos: f({ image: { maxFileSize: "64MB", maxFileCount: 30 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, files }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // File count validation handled on client-side for better UX

      // Check individual file types and filename validation (but allow large files for auto-resize)
      if (files) {
        for (const file of files) {
          // File type validation
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'unknown';
            throw new UploadThingError(`File type "${fileExtension}" is not supported. Please use JPG, JPEG, PNG, SVG, or WEBP files only.`);
          }

          // Additional filename validation
          if (file.name.length > 255) {
            throw new UploadThingError(`File name "${file.name}" is too long. Please use a shorter filename.`);
          }
          
          // Note: We removed file size validation here since we'll auto-resize large images
        }
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      const logPrefix = `[listingUploadPhotos] UserId: ${metadata.userId}, File: ${file.name}`;
      
      try {
        console.log(`${logPrefix} - Upload complete`);
        console.log(`${logPrefix} - Original URL: ${file.url}`);
        console.log(`${logPrefix} - Original size: ${file.size} bytes (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

        let finalUrl = file.url;
        let wasResized = false;
        let resizeError = null;
        const maxSizeBytes = 8 * 1024 * 1024; // 8MB

        // Check if the uploaded file is too large and needs resizing
        if (file.size > maxSizeBytes) {
          console.log(`${logPrefix} - File exceeds 8MB limit, attempting resize...`);
          
          try {
            // Fetch the uploaded image
            console.log(`${logPrefix} - Fetching uploaded image from: ${file.url}`);
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log(`${logPrefix} - Successfully fetched image, content-type: ${response.headers.get('content-type')}`);
            
            const imageBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(imageBuffer);
            console.log(`${logPrefix} - Converted to buffer, size: ${buffer.length} bytes`);
            
            // Get image metadata
            let imageMetadata;
            try {
              imageMetadata = await sharp(buffer).metadata();
              console.log(`${logPrefix} - Image metadata: ${imageMetadata.width}x${imageMetadata.height}, format: ${imageMetadata.format}, channels: ${imageMetadata.channels}`);
            } catch (metadataError) {
              console.error(`${logPrefix} - Error reading image metadata:`, metadataError);
              throw new Error(`Invalid image format or corrupted file: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
            }
            
            // Validate image has dimensions
            if (!imageMetadata.width || !imageMetadata.height) {
              throw new Error(`Invalid image dimensions: ${imageMetadata.width}x${imageMetadata.height}`);
            }
            
            // Calculate new dimensions to get under 8MB
            let quality = 85;
            let scaleFactor = 1;
            let resizedBuffer;
            let attempts = 0;
            const maxAttempts = 20; // Prevent infinite loops
            
            console.log(`${logPrefix} - Starting resize optimization...`);
            
            // Try different combinations of quality and scale until we get under 8MB
            do {
              attempts++;
              const newWidth = Math.floor(imageMetadata.width * scaleFactor);
              const newHeight = Math.floor(imageMetadata.height * scaleFactor);
              
              try {
                resizedBuffer = await sharp(buffer)
                  .resize(newWidth, newHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                  })
                  .jpeg({ quality, mozjpeg: true })
                  .toBuffer();
                
                const resizedSizeMB = (resizedBuffer.length / (1024 * 1024)).toFixed(2);
                console.log(`${logPrefix} - Resize attempt ${attempts}: ${newWidth}x${newHeight}, quality: ${quality}%, size: ${resizedSizeMB}MB`);
                
                // If still too large, adjust parameters
                if (resizedBuffer.length > maxSizeBytes) {
                  if (quality > 60) {
                    quality -= 10;
                  } else {
                    scaleFactor *= 0.9;
                    quality = 85; // Reset quality when scaling down
                  }
                }
                
              } catch (sharpError) {
                console.error(`${logPrefix} - Sharp processing error on attempt ${attempts}:`, sharpError);
                throw new Error(`Image processing failed: ${sharpError instanceof Error ? sharpError.message : 'Unknown Sharp error'}`);
              }
              
              // Safety breaks
              if (attempts >= maxAttempts) {
                console.warn(`${logPrefix} - Reached maximum resize attempts (${maxAttempts})`);
                break;
              }
              
              if (scaleFactor < 0.1) {
                console.warn(`${logPrefix} - Scale factor too small (${scaleFactor.toFixed(3)}), stopping resize attempts`);
                break;
              }
              
            } while (resizedBuffer.length > maxSizeBytes && attempts < maxAttempts);
            
            // Check final result
            if (resizedBuffer && resizedBuffer.length <= maxSizeBytes) {
              const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
              const finalSizeMB = (resizedBuffer.length / (1024 * 1024)).toFixed(2);
              console.log(`${logPrefix} - ✅ Resize successful: ${originalSizeMB}MB → ${finalSizeMB}MB (${((1 - resizedBuffer.length / file.size) * 100).toFixed(1)}% reduction)`);
              wasResized = true;
            } else {
              const finalSizeMB = resizedBuffer ? (resizedBuffer.length / (1024 * 1024)).toFixed(2) : 'unknown';
              console.warn(`${logPrefix} - ⚠️ Could not resize image to under 8MB. Final size: ${finalSizeMB}MB after ${attempts} attempts`);
              resizeError = `Could not optimize image to under 8MB limit after ${attempts} attempts`;
            }
            
          } catch (resizeProcessError) {
            const errorMessage = resizeProcessError instanceof Error ? resizeProcessError.message : 'Unknown resize error';
            console.error(`${logPrefix} - ❌ Resize process failed:`, resizeProcessError);
            console.error(`${logPrefix} - Error details:`, {
              message: errorMessage,
              stack: resizeProcessError instanceof Error ? resizeProcessError.stack : undefined,
              fileSize: file.size,
              fileType: file.type || 'unknown',
              fileName: file.name
            });
            resizeError = `Image resize failed: ${errorMessage}`;
            // Continue with original file
          }
        } else {
          console.log(`${logPrefix} - File size OK (${(file.size / (1024 * 1024)).toFixed(2)}MB), no resize needed`);
        }

        // Prepare return data
        const returnData = { 
          uploadedBy: metadata.userId, 
          fileUrl: finalUrl,
          originalSize: file.size,
          wasResized,
          resizeError,
          key: file.key,
          url: file.url
        };

        console.log(`${logPrefix} - ✅ Processing complete:`, {
          finalUrl,
          wasResized,
          resizeError: resizeError || 'none',
          originalSizeMB: (file.size / (1024 * 1024)).toFixed(2)
        });

        // Save file metadata to database
        try {
          await client.uploadedFile.create({
            data: {
              key: file.key,
              url: file.url,
              router: 'listingUploadPhotos',
              userId: metadata.userId,
              uploadedAt: new Date(),
              size: file.size,
              name: file.name,
            }
          });
          console.log(`${logPrefix} - Saved file metadata to database`);
        } catch (dbError) {
          console.error(`${logPrefix} - Failed to save to database:`, dbError);
          // Don't throw; let upload succeed but log error
        }

        return returnData;

      } catch (unexpectedError) {
        // Catch any unexpected errors to prevent them from causing generic client errors
        const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error';
        console.error(`${logPrefix} - 💥 UNEXPECTED ERROR in onUploadComplete:`, unexpectedError);
        console.error(`${logPrefix} - Error stack:`, unexpectedError instanceof Error ? unexpectedError.stack : 'No stack trace');
        console.error(`${logPrefix} - File info:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url,
          key: file.key
        });

        // Save file metadata to database even if processing failed
        try {
          await client.uploadedFile.create({
            data: {
              key: file.key,
              url: file.url,
              router: 'listingUploadPhotos',
              userId: metadata.userId,
              uploadedAt: new Date(),
              size: file.size,
              name: file.name,
            }
          });
          console.log(`${logPrefix} - Saved file metadata to database despite processing error`);
        } catch (dbError) {
          console.error(`${logPrefix} - Failed to save to database:`, dbError);
        }

        // Return basic success data even if processing failed
        // This prevents the upload from appearing as failed to the client
        return { 
          uploadedBy: metadata.userId, 
          fileUrl: file.url,
          originalSize: file.size,
          wasResized: false,
          resizeError: `Server processing error: ${errorMessage}`,
          key: file.key,
          url: file.url
        };
      }
    }),
  incomeUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 8 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Proof of income upload for userId:", metadata.userId);

      console.log("file url", file.url);

      // Save file metadata to database
      try {
        await client.uploadedFile.create({
          data: {
            key: file.key,
            url: file.url,
            router: 'incomeUploader',
            userId: metadata.userId,
            uploadedAt: new Date(),
            size: file.size,
            name: file.name,
          }
        });
        console.log("Proof of income upload for userId:", metadata.userId, "- Saved file metadata to database");
      } catch (dbError) {
        console.error("Proof of income upload for userId:", metadata.userId, "- Failed to save to database:", dbError);
        // Don't throw; let upload succeed but log error
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  idUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 8 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("ID image upload for userId:", metadata.userId);

      console.log("file url", file.url);

      // Save file metadata to database
      try {
        await client.uploadedFile.create({
          data: {
            key: file.key,
            url: file.url,
            router: 'idUploader',
            userId: metadata.userId,
            uploadedAt: new Date(),
            size: file.size,
            name: file.name,
          }
        });
        console.log("ID image upload for userId:", metadata.userId, "- Saved file metadata to database");
      } catch (dbError) {
        console.error("ID image upload for userId:", metadata.userId, "- Failed to save to database:", dbError);
        // Don't throw; let upload succeed but log error
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  messageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 12 }, video: { maxFileSize: "512MB", maxFileCount: 4 }, text: { maxFileSize: "8MB", maxFileCount: 4 }, audio: { maxFileSize: "8MB", maxFileCount: 4 }, pdf: { maxFileSize: "8MB", maxFileCount: 4 }, blob: { maxFileSize: "8MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const user = await auth();
      if (!user.userId) throw new UploadThingError("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Message attachment upload for userId:", metadata.userId);
      console.log("file url", file.url);

      // Save file metadata to database
      try {
        await client.uploadedFile.create({
          data: {
            key: file.key,
            url: file.url,
            router: 'messageUploader',
            userId: metadata.userId,
            uploadedAt: new Date(),
            size: file.size,
            name: file.name,
          }
        });
        console.log("Message attachment upload for userId:", metadata.userId, "- Saved file metadata to database");
      } catch (dbError) {
        console.error("Message attachment upload for userId:", metadata.userId, "- Failed to save to database:", dbError);
        // Don't throw; let upload succeed but log error
      }

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    text: { maxFileSize: "16MB", maxFileCount: 10 },
    blob: { maxFileSize: "16MB", maxFileCount: 10 },
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    spreadsheet: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const user = await auth();
      if (!user.userId) throw new UploadThingError("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("Document file url:", file.url);
      console.log("Document file key:", file.key);
      console.log("Document file name:", file.name);

      // Save file metadata to database
      try {
        await client.uploadedFile.create({
          data: {
            key: file.key,
            url: file.url,
            router: 'documentUploader',
            userId: metadata.userId,
            uploadedAt: new Date(),
            size: file.size,
            name: file.name,
          }
        });
        console.log("Document upload complete for userId:", metadata.userId, "- Saved file metadata to database");
      } catch (dbError) {
        console.error("Document upload complete for userId:", metadata.userId, "- Failed to save to database:", dbError);
        // Don't throw; let upload succeed but log error
      }

      return { 
        uploadedBy: metadata.userId, 
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

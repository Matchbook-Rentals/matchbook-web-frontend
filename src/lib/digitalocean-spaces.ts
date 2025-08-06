import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

// Configure DigitalOcean Spaces client
const spacesClient = new S3Client({
  endpoint: process.env.DIGITALOCEAN_SPACES_ENDPOINT || 'https://atl1.digitaloceanspaces.com',
  region: 'us-east-1', // DigitalOcean Spaces requires this region
  credentials: {
    accessKeyId: process.env.DIGITALOCEAN_SPACES_KEY || '',
    secretAccessKey: process.env.DIGITALOCEAN_SPACES_SECRET || '',
  },
});

const BUCKET_NAME = process.env.DIGITALOCEAN_SPACES_BUCKET || 'matchbook-rentals';
const PDF_ORIGINAL_PREFIX = 'pdf-templates/original/';
const PDF_SIGNED_PREFIX = 'pdf-templates/signed/';

export interface PdfUploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export class DigitalOceanSpacesService {
  /**
   * Upload a PDF file to DigitalOcean Spaces
   */
  async uploadPdf(file: Buffer, originalName: string, userId: string): Promise<PdfUploadResult> {
    try {
      const fileExtension = originalName.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'pdf') {
        throw new Error('Only PDF files are allowed');
      }

      const fileKey = `${PDF_ORIGINAL_PREFIX}${userId}/${nanoid(12)}-${Date.now()}.pdf`;
      const fileName = originalName;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file,
        ContentType: 'application/pdf',
        Metadata: {
          originalName: fileName,
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await spacesClient.send(command);

      const fileUrl = `${process.env.DIGITALOCEAN_SPACES_ENDPOINT}/${BUCKET_NAME}/${fileKey}`;

      return {
        fileKey,
        fileUrl,
        fileName,
        fileSize: file.length,
      };
    } catch (error) {
      console.error('Error uploading PDF to DigitalOcean Spaces:', error);
      throw new Error('Failed to upload PDF file');
    }
  }

  /**
   * Get a PDF file from DigitalOcean Spaces
   */
  async getPdf(fileKey: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });

      const response = await spacesClient.send(command);
      
      if (!response.Body) {
        return null;
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      if ((error as any).name === 'NoSuchKey') {
        return null;
      }
      console.error('Error retrieving PDF from DigitalOcean Spaces:', error);
      throw new Error('Failed to retrieve PDF file');
    }
  }

  /**
   * Delete a PDF file from DigitalOcean Spaces
   */
  async deletePdf(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });

      await spacesClient.send(command);
    } catch (error) {
      console.error('Error deleting PDF from DigitalOcean Spaces:', error);
      throw new Error('Failed to delete PDF file');
    }
  }

  /**
   * Get PDF file metadata
   */
  async getPdfMetadata(fileKey: string): Promise<{ size: number; lastModified: Date } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });

      const response = await spacesClient.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      if ((error as any).name === 'NoSuchKey') {
        return null;
      }
      console.error('Error getting PDF metadata from DigitalOcean Spaces:', error);
      throw new Error('Failed to get PDF metadata');
    }
  }

  /**
   * Generate a presigned URL for PDF download
   */
  async generateDownloadUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });

      return await getSignedUrl(spacesClient, command, { expiresIn });
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Upload a signed/generated PDF
   */
  async uploadSignedPdf(file: Buffer, templateId: string, suffix: string = 'signed'): Promise<PdfUploadResult> {
    try {
      const fileKey = `${PDF_SIGNED_PREFIX}${templateId}-${suffix}-${Date.now()}.pdf`;
      const fileName = `${templateId}-${suffix}.pdf`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file,
        ContentType: 'application/pdf',
        Metadata: {
          templateId: templateId,
          generatedAt: new Date().toISOString(),
          type: 'signed-pdf',
        },
      });

      await spacesClient.send(command);

      const fileUrl = `${process.env.DIGITALOCEAN_SPACES_ENDPOINT}/${BUCKET_NAME}/${fileKey}`;

      return {
        fileKey,
        fileUrl,
        fileName,
        fileSize: file.length,
      };
    } catch (error) {
      console.error('Error uploading signed PDF to DigitalOcean Spaces:', error);
      throw new Error('Failed to upload signed PDF file');
    }
  }

  /**
   * Test connection to DigitalOcean Spaces
   */
  async testConnection(): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: 'test-connection', // This doesn't need to exist
      });

      await spacesClient.send(command);
      return true;
    } catch (error) {
      // Expected error if object doesn't exist, but connection works
      if ((error as any).name === 'NotFound' || (error as any).name === 'NoSuchKey') {
        return true;
      }
      console.error('DigitalOcean Spaces connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const digitalOceanSpaces = new DigitalOceanSpacesService();
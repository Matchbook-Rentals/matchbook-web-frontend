import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { FieldFormType } from '@/components/pdf-editor/types';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';

export interface ExportOptions {
  showFieldBorders?: boolean;
  includeLabels?: boolean;
  fieldOpacity?: number;
}

export async function exportPDFWithFields(
  originalPdfBytes: ArrayBuffer,
  fields: FieldFormType[],
  recipients: Recipient[],
  signedValues: Record<string, any> = {},
  options: ExportOptions = {}
): Promise<Uint8Array> {
  const {
    showFieldBorders = false, // Don't show borders in final export
    includeLabels = true,
    fieldOpacity = 1.0 // Full opacity for final values
  } = options;

  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Process each field
    for (const field of fields) {
      const page = pages[field.pageNumber - 1];
      if (!page) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      // Convert percentage coordinates to PDF coordinates
      // PDF coordinates start from bottom-left, so we need to flip Y
      const x = (field.pageX / 100) * pageWidth;
      const y = pageHeight - ((field.pageY / 100) * pageHeight) - ((field.pageHeight / 100) * pageHeight);
      const width = (field.pageWidth / 100) * pageWidth;
      const height = (field.pageHeight / 100) * pageHeight;

      // Get the signed value for this field
      const signedValue = signedValues[field.formId];

      // Extract the actual value - handle both string and object formats
      let displayText = '';
      if (signedValue) {
        if (typeof signedValue === 'string') {
          displayText = signedValue;
        } else if (typeof signedValue === 'object' && signedValue !== null) {
          // Handle object format (e.g., {type: 'drawn', data: 'base64...'} or {data: '...'})
          displayText = (signedValue as any).data || (signedValue as any).value || String(signedValue);
        } else {
          // Convert other types to string
          displayText = String(signedValue);
        }
      }

      // Draw field border if requested
      if (showFieldBorders) {
        const recipient = recipients.find(r => r.id === field.signerEmail);
        const borderColor = recipient?.color ?
          rgb(
            parseInt(recipient.color.slice(1, 3), 16) / 255,
            parseInt(recipient.color.slice(3, 5), 16) / 255,
            parseInt(recipient.color.slice(5, 7), 16) / 255
          ) : rgb(0.5, 0.5, 0.5);

        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor,
          borderWidth: 1,
          opacity: fieldOpacity,
        });
      }

      // Draw the field content
      if (displayText && includeLabels) {
        // Check if this is a base64 image (drawn signature)
        const isBase64Image = typeof displayText === 'string' &&
          displayText.startsWith('data:image/png;base64,');

        if (isBase64Image) {
          try {
            // Extract base64 data (remove the data URL prefix)
            const base64Data = displayText.replace(/^data:image\/png;base64,/, '');
            const imageBytes = Buffer.from(base64Data, 'base64');

            // Embed the signature image
            const signatureImage = await pdfDoc.embedPng(imageBytes);
            const imageDims = signatureImage.scale(1);

            // Calculate scaling to fit within field bounds while maintaining aspect ratio
            const scaleX = width / imageDims.width;
            const scaleY = height / imageDims.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

            const scaledWidth = imageDims.width * scale;
            const scaledHeight = imageDims.height * scale;

            // Center the image within the field
            const imageX = x + (width - scaledWidth) / 2;
            const imageY = y + (height - scaledHeight) / 2;

            page.drawImage(signatureImage, {
              x: imageX,
              y: imageY,
              width: scaledWidth,
              height: scaledHeight,
            });
          } catch (error) {
            console.error('Error embedding signature image:', error);
            // Fall back to text rendering if image embedding fails
          }
        } else {
          // Render as text (typed signatures or regular text fields)
          // Calculate appropriate font size
          const maxFontSize = Math.min(height * 0.6, 12);
          const fontSize = Math.max(8, maxFontSize);

          // Choose font based on field type
          const fieldFont = field.type === 'SIGNATURE' ? boldFont : font;

          // Calculate text positioning (centered)
          const textWidth = fieldFont.widthOfTextAtSize(displayText, fontSize);
          const textX = x + Math.max(0, (width - textWidth) / 2);
          const textY = y + (height - fontSize) / 2;

          page.drawText(displayText, {
            x: textX,
            y: textY,
            size: fontSize,
            font: fieldFont,
            color: rgb(0, 0, 0),
          });
        }
      }
    }

    // Return the modified PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

// Helper function to download a blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Create a template from fields and recipients
export async function createPDFTemplate(
  fields: FieldFormType[],
  recipients: Recipient[],
  metadata: { title?: string; author?: string; subject?: string } = {}
) {
  const template = {
    ...metadata,
    version: '1.0',
    createdAt: new Date().toISOString(),
    fields: fields.map(field => ({
      id: field.formId,
      type: field.type,
      pageNumber: field.pageNumber,
      coordinates: {
        x: field.pageX,
        y: field.pageY,
        width: field.pageWidth,
        height: field.pageHeight,
      },
      recipientEmail: field.signerEmail,
      recipientIndex: field.recipientIndex,
      metadata: field.fieldMeta,
    })),
    recipients: recipients.map((recipient, index) => ({
      ...recipient,
      index,
    })),
  };

  return { template };
}
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { FieldFormType } from '@/components/pdf-editor/types';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';

export interface ExportOptions {
  showFieldBorders?: boolean;
  includeLabels?: boolean;
  fieldOpacity?: number;
  flatten?: boolean; // Flatten form fields to make them non-editable
  removeLinks?: boolean; // Remove all hyperlinks and external references
}

// Map of font family names to font file names
const SIGNATURE_FONT_FILES: Record<string, string> = {
  'dancing-script': 'DancingScript-Regular.ttf',
  'caveat': 'Caveat-Regular.ttf',
  'kalam': 'Kalam-Bold.ttf',
  'great-vibes': 'GreatVibes-Regular.ttf',
  'pacifico': 'Pacifico-Regular.ttf',
  'sacramento': 'Sacramento-Regular.ttf',
  'allura': 'Allura-Regular.ttf',
  'satisfy': 'Satisfy-Regular.ttf',
};

// Helper function to load signature fonts
async function loadSignatureFonts(pdfDoc: PDFDocument) {
  const fonts: Record<string, any> = {};
  const isServer = typeof window === 'undefined';

  for (const [fontKey, fileName] of Object.entries(SIGNATURE_FONT_FILES)) {
    try {
      let fontBytes: ArrayBuffer;

      if (isServer) {
        // Server-side: use fs to read from file system
        const fs = await import('fs');
        const path = await import('path');
        const fontPath = path.join(process.cwd(), 'public', 'fonts', fileName);
        console.log(`Loading font from: ${fontPath}`);

        // Check if file exists
        if (!fs.existsSync(fontPath)) {
          console.error(`Font file not found: ${fontPath}`);
          continue;
        }

        fontBytes = fs.readFileSync(fontPath);
        console.log(`Font ${fileName} loaded, size: ${fontBytes.length} bytes`);
      } else {
        // Client-side: fetch from public directory
        const response = await fetch(`/fonts/${fileName}`);
        if (!response.ok) {
          console.error(`Font file not found: /fonts/${fileName}`);
          continue;
        }
        fontBytes = await response.arrayBuffer();
        console.log(`Font ${fileName} fetched, size: ${fontBytes.byteLength} bytes`);
      }

      fonts[fontKey] = await pdfDoc.embedFont(fontBytes);
      console.log(`Font ${fontKey} embedded successfully`);
    } catch (error) {
      console.error(`Error loading font ${fileName}:`, error);
      // Font will be undefined if it fails to load, will fall back to default
    }
  }

  console.log(`Loaded signature fonts:`, Object.keys(fonts));
  return fonts;
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
    fieldOpacity = 1.0, // Full opacity for final values
    flatten = true, // Flatten by default to make read-only
    removeLinks = true // Remove links by default
  } = options;

  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    // Register fontkit to enable custom font embedding
    pdfDoc.registerFontkit(fontkit);

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load signature fonts
    const signatureFonts = await loadSignatureFonts(pdfDoc);

    // Flatten form fields to make them non-editable
    if (flatten) {
      try {
        const form = pdfDoc.getForm();
        const formFields = form.getFields();

        if (formFields.length > 0) {
          console.log(`Flattening ${formFields.length} form fields`);
          form.flatten();
        }
      } catch (error) {
        // If there's no form or flattening fails, continue
        console.log('No form fields to flatten or flattening not needed');
      }
    }

    // Remove hyperlinks and annotations to prevent external references
    if (removeLinks) {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        try {
          // Get the page's annotations dictionary
          const annots = page.node.Annots();
          if (annots) {
            // Remove all annotations (which includes links)
            page.node.delete('Annots');
            console.log('Removed annotations from page');
          }
        } catch (error) {
          // Continue if annotation removal fails for a page
          console.log('No annotations to remove from page');
        }
      }
    }

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

      // Extract the actual value and font info - handle both string and object formats
      let displayText = '';
      let fontFamily: string | undefined;
      let signatureType: 'drawn' | 'typed' | undefined;

      if (signedValue) {
        if (typeof signedValue === 'string') {
          displayText = signedValue;
        } else if (typeof signedValue === 'object' && signedValue !== null) {
          // Handle object format with metadata (e.g., {type: 'typed', value: 'John Doe', fontFamily: 'dancing-script'})
          signatureType = (signedValue as any).type;
          fontFamily = (signedValue as any).fontFamily;
          displayText = (signedValue as any).value || (signedValue as any).data || String(signedValue);

          // Log signature field info for debugging
          if (field.type === 'SIGNATURE' || field.type === 'INITIALS') {
            console.log(`Processing ${field.type} field:`, {
              fieldId: field.formId,
              signatureType,
              fontFamily,
              displayText: displayText.substring(0, 50),
              hasFontInMap: fontFamily ? !!signatureFonts[fontFamily] : false
            });
          }
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

          // Choose font based on field type and signature metadata
          let fieldFont;

          // For typed signatures/initials with a fontFamily, use the signature font
          if (signatureType === 'typed' && fontFamily && signatureFonts[fontFamily]) {
            fieldFont = signatureFonts[fontFamily];
          } else if (field.type === 'SIGNATURE' || field.type === 'INITIALS') {
            // Fallback for signatures without font metadata - use bold or default signature font
            fieldFont = signatureFonts['dancing-script'] || boldFont;
          } else {
            // Regular fields use standard font
            fieldFont = font;
          }

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

/**
 * Sanitize and flatten a PDF to make it read-only
 * Removes form fields, hyperlinks, and interactive elements
 */
export async function sanitizePDF(
  pdfBytes: ArrayBuffer,
  options: { flatten?: boolean; removeLinks?: boolean } = {}
): Promise<Uint8Array> {
  const { flatten = true, removeLinks = true } = options;

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Flatten form fields to make them non-editable
    if (flatten) {
      try {
        const form = pdfDoc.getForm();
        const formFields = form.getFields();

        if (formFields.length > 0) {
          console.log(`Flattening ${formFields.length} form fields`);
          form.flatten();
        }
      } catch (error) {
        console.log('No form fields to flatten or flattening not needed');
      }
    }

    // Remove hyperlinks and annotations to prevent external references
    if (removeLinks) {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        try {
          const annots = page.node.Annots();
          if (annots) {
            page.node.delete('Annots');
            console.log('Removed annotations from page');
          }
        } catch (error) {
          console.log('No annotations to remove from page');
        }
      }
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error sanitizing PDF:', error);
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
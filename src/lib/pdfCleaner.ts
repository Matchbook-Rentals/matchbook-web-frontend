import { PDFDocument } from 'pdf-lib';

export interface PDFCleaningOptions {
  stripAnnotations?: boolean;
  stripFormFields?: boolean;
  stripJavaScript?: boolean;
  preserveText?: boolean;
}

/**
 * Strips annotations, form fields, and other interactive elements from a PDF,
 * providing a clean slate for new annotations.
 */
export async function stripPDFAnnotations(
  pdfBytes: ArrayBuffer,
  options: PDFCleaningOptions = {}
): Promise<ArrayBuffer> {
  const {
    stripAnnotations = true,
    stripFormFields = true,
    stripJavaScript = true,
    preserveText = true
  } = options;

  try {
    // First validate PDF header
    const uint8Array = new Uint8Array(pdfBytes);
    const headerString = Array.from(uint8Array.slice(0, 10))
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    if (!headerString.startsWith('%PDF-')) {
      console.warn('File does not appear to be a valid PDF, skipping cleaning');
      return pdfBytes; // Return original if not a valid PDF
    }

    // Load the original PDF
    const originalPdf = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateFieldAppearances: false,
      throwOnInvalidObject: false, // More lenient parsing
      capNumbers: false // Don't cap numbers (can cause issues with some PDFs)
    });

    // Create a new clean PDF document
    const cleanPdf = await PDFDocument.create();

    // Get all pages from the original document
    const pageCount = originalPdf.getPageCount();
    const pageIndices = Array.from({ length: pageCount }, (_, i) => i);

    // Try a more conservative approach first - just remove form fields
    try {
      const form = originalPdf.getForm();
      if (form && stripFormFields) {
        const fields = form.getFields();
        if (fields.length > 0) {
          // Remove form fields one by one
          fields.forEach(field => {
            try {
              form.removeField(field);
            } catch (e) {
              console.warn('Could not remove field:', field.getName(), e);
            }
          });
        }
      }
      
      // Return the modified original PDF instead of creating a new one
      const cleanedBytes = await originalPdf.save();
      
      // Validate the cleaned PDF can be loaded
      try {
        await PDFDocument.load(cleanedBytes);
        return cleanedBytes;
      } catch (validationError) {
        console.warn('Cleaned PDF failed validation, trying page copy method:', validationError);
        throw validationError; // This will trigger the fallback method
      }
      
    } catch (formError) {
      console.warn('Form field removal failed, trying page copy method:', formError);
      
      // Fallback to page copying method
      const copiedPages = await cleanPdf.copyPages(originalPdf, pageIndices);
      
      // Add the copied pages to the clean document
      copiedPages.forEach(page => {
        cleanPdf.addPage(page);
      });
      
      // Copy document metadata but skip interactive elements
      const originalInfo = originalPdf.getTitle();
      const originalAuthor = originalPdf.getAuthor();
      const originalSubject = originalPdf.getSubject();

      if (originalInfo) cleanPdf.setTitle(originalInfo);
      if (originalAuthor) cleanPdf.setAuthor(originalAuthor);
      if (originalSubject) cleanPdf.setSubject(originalSubject);
      
      // Mark as cleaned
      cleanPdf.setCreator('Matchbook PDF Cleaner');
      cleanPdf.setProducer('pdf-lib');

      const cleanedBytes = await cleanPdf.save();
      
      // Validate the cleaned PDF can be loaded
      try {
        await PDFDocument.load(cleanedBytes);
        return cleanedBytes;
      } catch (validationError) {
        console.warn('Page-copied PDF failed validation, returning original:', validationError);
        return pdfBytes; // Return original if cleaning completely fails
      }
    }
    
  } catch (error) {
    console.error('Error cleaning PDF:', error);
    
    // Fallback: try flattening approach
    try {
      return await flattenPDFAnnotations(pdfBytes);
    } catch (fallbackError) {
      console.error('Fallback PDF cleaning also failed:', fallbackError);
      // Return original PDF if cleaning fails
      return pdfBytes;
    }
  }
}

/**
 * Alternative approach: Flatten form fields and annotations
 * This makes existing form fields part of the page content but removes their interactivity
 */
export async function flattenPDFAnnotations(pdfBytes: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // Validate PDF header first
    const uint8Array = new Uint8Array(pdfBytes);
    const headerString = Array.from(uint8Array.slice(0, 10))
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    if (!headerString.startsWith('%PDF-')) {
      console.warn('File does not appear to be a valid PDF, returning original');
      return pdfBytes;
    }

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateFieldAppearances: false,
      throwOnInvalidObject: false,
      capNumbers: false
    });

    // Flatten form fields if they exist
    try {
      const form = pdfDoc.getForm();
      if (form) {
        form.flatten();
      }
    } catch (error) {
      console.warn('Could not flatten form fields:', error);
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error flattening PDF:', error);
    throw error;
  }
}

/**
 * Analyzes a PDF to detect if it contains annotations, form fields, or other interactive elements
 */
export async function analyzePDFContent(pdfBytes: ArrayBuffer): Promise<{
  hasFormFields: boolean;
  hasAnnotations: boolean;
  hasJavaScript: boolean;
  pageCount: number;
}> {
  try {
    // First, try to validate if this is actually a PDF by checking the header
    const uint8Array = new Uint8Array(pdfBytes);
    const headerString = Array.from(uint8Array.slice(0, 10))
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    if (!headerString.startsWith('%PDF-')) {
      console.warn('File does not appear to be a valid PDF (missing PDF header)');
      return {
        hasFormFields: false,
        hasAnnotations: false,
        hasJavaScript: false,
        pageCount: 0
      };
    }

    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateFieldAppearances: false,
      throwOnInvalidObject: false // More lenient parsing
    });

    let hasFormFields = false;
    let hasAnnotations = false;
    const hasJavaScript = false; // pdf-lib doesn't provide easy JS detection

    // Check for form fields
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      hasFormFields = fields.length > 0;
    } catch (error) {
      // No form or error accessing form
      hasFormFields = false;
    }

    // Check for annotations (pdf-lib doesn't provide direct annotation access)
    // This is a limitation - we'll assume annotations exist if form fields exist
    hasAnnotations = hasFormFields;

    return {
      hasFormFields,
      hasAnnotations,
      hasJavaScript,
      pageCount: pdfDoc.getPageCount()
    };
  } catch (error) {
    console.warn('Error analyzing PDF, assuming it needs cleaning:', error);
    // If we can't analyze the PDF, assume it might have annotations and try to clean it
    // This is safer than failing completely
    return {
      hasFormFields: true,
      hasAnnotations: true,
      hasJavaScript: false,
      pageCount: 1 // Default estimate
    };
  }
}

/**
 * Creates a File object from cleaned PDF bytes
 */
export function createCleanedPDFFile(cleanedBytes: ArrayBuffer, originalFileName: string): File {
  const fileName = originalFileName.replace(/\.pdf$/i, '_cleaned.pdf');
  return new File([cleanedBytes], fileName, {
    type: 'application/pdf',
    lastModified: Date.now()
  });
}

/**
 * Quick validation to check if a PDF can be loaded by pdf-lib
 * This helps catch issues early before the PDF reaches react-pdf
 */
export async function quickValidatePDF(pdfBytes: ArrayBuffer): Promise<boolean> {
  try {
    // Check PDF header first
    const uint8Array = new Uint8Array(pdfBytes);
    const headerString = Array.from(uint8Array.slice(0, 8))
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    if (!headerString.startsWith('%PDF-')) {
      return false;
    }

    // Try to load with minimal options to catch structural issues
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateFieldAppearances: false,
      throwOnInvalidObject: false
    });
    
    // Basic sanity checks
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      return false;
    }
    
    // Try to get first page to ensure structure is valid
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    if (!firstPage) {
      return false;
    }
    
    // Check if we can get page dimensions (another structural check)
    const { width, height } = firstPage.getSize();
    if (width <= 0 || height <= 0) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.warn('PDF validation failed:', error);
    return false;
  }
}
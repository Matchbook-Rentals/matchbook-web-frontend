import { PDF_VIEWER_PAGE_SELECTOR } from './PDFViewer';
import { FieldFormType, FieldType, FIELD_DIMENSIONS } from './types';
import { nanoid } from 'nanoid';

// Get page element from mouse event
export const getPage = (event: MouseEvent, selector: string): HTMLElement | null => {
  const target = event.target as Element;
  return target?.closest(selector) as HTMLElement;
};

// Check if point is within page bounds considering field dimensions
export const isWithinPageBounds = (
  event: MouseEvent,
  selector: string,
  fieldWidth: number,
  fieldHeight: number,
): boolean => {
  const $page = getPage(event, selector);
  if (!$page) return false;

  const { top, left, height, width } = $page.getBoundingClientRect();
  
  const mouseX = event.clientX - left;
  const mouseY = event.clientY - top;
  
  // Calculate field bounds when centered on cursor
  const fieldLeft = mouseX - fieldWidth / 2;
  const fieldTop = mouseY - fieldHeight / 2;
  const fieldRight = mouseX + fieldWidth / 2;
  const fieldBottom = mouseY + fieldHeight / 2;
  
  // Check if centered field would fit within page bounds
  return (
    fieldLeft >= 0 &&
    fieldTop >= 0 &&
    fieldRight <= width &&
    fieldBottom <= height
  );
};

// Convert click position to field coordinates (percentage-based)
export const createFieldAtPosition = (
  event: MouseEvent,
  $page: HTMLElement,
  fieldType: FieldType,
  signerEmail: string,
  recipientIndex: number = 0,
): FieldFormType => {
  const { top, left, height, width } = $page.getBoundingClientRect();
  const pageNumber = parseInt($page.getAttribute('data-page-number') || '1', 10);
  
  // Get field dimensions
  const fieldDimensions = FIELD_DIMENSIONS[fieldType];
  
  // Calculate click position relative to page
  let pageX = ((event.clientX - left) / width) * 100;
  let pageY = ((event.clientY - top) / height) * 100;
  
  // Calculate field dimensions as percentages
  const fieldPageWidth = (fieldDimensions.width / width) * 100;
  const fieldPageHeight = (fieldDimensions.height / height) * 100;
  
  // Center the field on the click position
  pageX -= fieldPageWidth / 2;
  pageY -= fieldPageHeight / 2;
  
  // Ensure field stays within page bounds
  pageX = Math.max(0, Math.min(pageX, 100 - fieldPageWidth));
  pageY = Math.max(0, Math.min(pageY, 100 - fieldPageHeight));
  
  return {
    formId: nanoid(12),
    type: fieldType,
    pageNumber,
    pageX,
    pageY,
    pageWidth: fieldPageWidth,
    pageHeight: fieldPageHeight,
    signerEmail,
    recipientIndex,
  };
};

// Calculate field bounds for ghost cursor
export const getFieldBounds = (fieldType: FieldType) => {
  const dimensions = FIELD_DIMENSIONS[fieldType];
  return {
    width: dimensions.width,
    height: dimensions.height,
  };
};

// Convert percentage coordinates to pixel coordinates for rendering
export const convertPercentToPixel = (
  field: FieldFormType,
  pageElement: HTMLElement,
): { x: number; y: number; width: number; height: number } => {
  const { width, height, top, left } = pageElement.getBoundingClientRect();
  
  return {
    x: (field.pageX / 100) * width + left,
    y: (field.pageY / 100) * height + top,
    width: (field.pageWidth / 100) * width,
    height: (field.pageHeight / 100) * height,
  };
};

// Convert pixel coordinates to percentage coordinates for storage
export const convertPixelToPercent = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageElement: HTMLElement,
): { pageX: number; pageY: number; pageWidth: number; pageHeight: number } => {
  const pageRect = pageElement.getBoundingClientRect();
  
  return {
    pageX: ((x - pageRect.left) / pageRect.width) * 100,
    pageY: ((y - pageRect.top) / pageRect.height) * 100,
    pageWidth: (width / pageRect.width) * 100,
    pageHeight: (height / pageRect.height) * 100,
  };
};

// Validate field positions are within bounds
export const validateFieldBounds = (field: FieldFormType): boolean => {
  return (
    field.pageX >= 0 &&
    field.pageY >= 0 &&
    field.pageX + field.pageWidth <= 100 &&
    field.pageY + field.pageHeight <= 100
  );
};

// Find the best position for a sign date field relative to a signature field
export const findBestPositionForSignDate = (
  signatureField: FieldFormType,
  existingFields: FieldFormType[],
  pageElement: HTMLElement
): { pageX: number; pageY: number; pageWidth: number; pageHeight: number } => {
  const signDateDimensions = FIELD_DIMENSIONS[FieldType.SIGN_DATE];
  const { width: pageWidth, height: pageHeight } = pageElement.getBoundingClientRect();
  
  // Calculate sign date field dimensions as percentages
  const signDatePageWidth = (signDateDimensions.width / pageWidth) * 100;
  const signDatePageHeight = (signDateDimensions.height / pageHeight) * 100;
  
  // Define spacing between fields (in percentage)
  const spacing = 1; // 1% spacing
  
  // Priority order: right, below, left, above
  const positions = [
    // Right side
    {
      pageX: signatureField.pageX + signatureField.pageWidth + spacing,
      pageY: signatureField.pageY,
    },
    // Below
    {
      pageX: signatureField.pageX,
      pageY: signatureField.pageY + signatureField.pageHeight + spacing,
    },
    // Left side
    {
      pageX: signatureField.pageX - signDatePageWidth - spacing,
      pageY: signatureField.pageY,
    },
    // Above
    {
      pageX: signatureField.pageX,
      pageY: signatureField.pageY - signDatePageHeight - spacing,
    },
  ];
  
  // Check each position for availability
  for (const position of positions) {
    const proposedField = {
      ...position,
      pageWidth: signDatePageWidth,
      pageHeight: signDatePageHeight,
    };
    
    // Check if position is within page bounds
    if (!validateFieldBounds(proposedField)) {
      continue;
    }
    
    // Check if position overlaps with existing fields
    const hasOverlap = existingFields.some(field => {
      return !(
        proposedField.pageX + proposedField.pageWidth <= field.pageX ||
        field.pageX + field.pageWidth <= proposedField.pageX ||
        proposedField.pageY + proposedField.pageHeight <= field.pageY ||
        field.pageY + field.pageHeight <= proposedField.pageY
      );
    });
    
    if (!hasOverlap) {
      return proposedField;
    }
  }
  
  // If no position works, default to right side (may overlap)
  return {
    pageX: Math.min(signatureField.pageX + signatureField.pageWidth + spacing, 100 - signDatePageWidth),
    pageY: signatureField.pageY,
    pageWidth: signDatePageWidth,
    pageHeight: signDatePageHeight,
  };
};

// Find the best position for an initial date field relative to an initials field
export const findBestPositionForInitialDate = (
  initialsField: FieldFormType,
  existingFields: FieldFormType[],
  pageElement: HTMLElement
): { pageX: number; pageY: number; pageWidth: number; pageHeight: number } => {
  const initialDateDimensions = FIELD_DIMENSIONS[FieldType.INITIAL_DATE];
  const { width: pageWidth, height: pageHeight } = pageElement.getBoundingClientRect();
  
  // Calculate initial date field dimensions as percentages
  const initialDatePageWidth = (initialDateDimensions.width / pageWidth) * 100;
  const initialDatePageHeight = (initialDateDimensions.height / pageHeight) * 100;
  
  // Define spacing between fields (in percentage)
  const spacing = 1; // 1% spacing
  
  // Priority order: right, below, left, above
  const positions = [
    // Right side
    {
      pageX: initialsField.pageX + initialsField.pageWidth + spacing,
      pageY: initialsField.pageY,
    },
    // Below
    {
      pageX: initialsField.pageX,
      pageY: initialsField.pageY + initialsField.pageHeight + spacing,
    },
    // Left side
    {
      pageX: initialsField.pageX - initialDatePageWidth - spacing,
      pageY: initialsField.pageY,
    },
    // Above
    {
      pageX: initialsField.pageX,
      pageY: initialsField.pageY - initialDatePageHeight - spacing,
    },
  ];
  
  // Check each position for availability
  for (const position of positions) {
    const proposedField = {
      ...position,
      pageWidth: initialDatePageWidth,
      pageHeight: initialDatePageHeight,
    };
    
    // Check if position is within page bounds
    if (!validateFieldBounds(proposedField)) {
      continue;
    }
    
    // Check if position overlaps with existing fields
    const hasOverlap = existingFields.some(field => {
      return !(
        proposedField.pageX + proposedField.pageWidth <= field.pageX ||
        field.pageX + field.pageWidth <= proposedField.pageX ||
        proposedField.pageY + proposedField.pageHeight <= field.pageY ||
        field.pageY + field.pageHeight <= proposedField.pageY
      );
    });
    
    if (!hasOverlap) {
      return proposedField;
    }
  }
  
  // If no position works, default to right side (may overlap)
  return {
    pageX: Math.min(initialsField.pageX + initialsField.pageWidth + spacing, 100 - initialDatePageWidth),
    pageY: initialsField.pageY,
    pageWidth: initialDatePageWidth,
    pageHeight: initialDatePageHeight,
  };
};
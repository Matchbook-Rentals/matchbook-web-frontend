import { FieldFormType, FieldType } from './types';

// Validation for required fields
export const validateFieldsUninserted = (fields: FieldFormType[]) => {
  const emptyCheckboxFields = fields.filter(
    (field) =>
      field.type === FieldType.CHECKBOX &&
      (!field.fieldMeta || !field.fieldMeta.values || field.fieldMeta.values.length === 0),
  );

  const emptyRadioFields = fields.filter(
    (field) =>
      field.type === FieldType.RADIO && 
      (!field.fieldMeta || !field.fieldMeta.values || field.fieldMeta.values.length === 0),
  );

  const emptyDropdownFields = fields.filter(
    (field) =>
      field.type === FieldType.DROPDOWN &&
      (!field.fieldMeta || !field.fieldMeta.values || field.fieldMeta.values.length === 0),
  );

  return {
    hasErrors:
      emptyCheckboxFields.length > 0 ||
      emptyRadioFields.length > 0 ||
      emptyDropdownFields.length > 0,
    fieldsWithError: [...emptyCheckboxFields, ...emptyRadioFields, ...emptyDropdownFields],
    emptyCheckboxFields,
    emptyRadioFields,
    emptyDropdownFields,
  };
};

// Validate individual field
export const validateField = (field: FieldFormType): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (field.fieldMeta?.required) {
    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.NAME:
        if (!field.fieldMeta.placeholder && !field.fieldMeta.label) {
          errors.push('Text field must have a label or placeholder');
        }
        break;
      case FieldType.CHECKBOX:
      case FieldType.RADIO:
      case FieldType.DROPDOWN:
        if (!field.fieldMeta.values || field.fieldMeta.values.length === 0) {
          errors.push(`${field.type} field must have at least one option`);
        }
        break;
    }
  }

  // Validate field positioning
  if (field.pageX < 0 || field.pageX > 100) {
    errors.push('Field X position must be between 0 and 100%');
  }
  if (field.pageY < 0 || field.pageY > 100) {
    errors.push('Field Y position must be between 0 and 100%');
  }
  if (field.pageX + field.pageWidth > 100) {
    errors.push('Field extends beyond page width');
  }
  if (field.pageY + field.pageHeight > 100) {
    errors.push('Field extends beyond page height');
  }

  // Validate field dimensions
  if (field.pageWidth <= 0 || field.pageHeight <= 0) {
    errors.push('Field dimensions must be positive');
  }

  // Validate email format for email fields
  if (field.type === FieldType.EMAIL && field.fieldMeta?.pattern) {
    try {
      new RegExp(field.fieldMeta.pattern);
    } catch {
      errors.push('Invalid email pattern regex');
    }
  }

  // Validate number constraints
  if (field.type === FieldType.NUMBER) {
    if (field.fieldMeta?.minLength !== undefined && field.fieldMeta?.maxLength !== undefined) {
      if (field.fieldMeta.minLength > field.fieldMeta.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate all fields
export const validateAllFields = (fields: FieldFormType[]) => {
  const fieldValidations = fields.map(field => ({
    field,
    validation: validateField(field),
  }));

  const invalidFields = fieldValidations.filter(fv => !fv.validation.valid);
  const allErrors = invalidFields.reduce<string[]>((acc, fv) => {
    return acc.concat(fv.validation.errors.map(error => `Field ${fv.field.formId}: ${error}`));
  }, []);

  return {
    valid: invalidFields.length === 0,
    errors: allErrors,
    invalidFields: invalidFields.map(fv => fv.field),
    fieldValidations,
  };
};

// Check for field overlaps
export const checkFieldOverlaps = (fields: FieldFormType[]) => {
  const overlaps: { field1: FieldFormType; field2: FieldFormType }[] = [];

  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const field1 = fields[i];
      const field2 = fields[j];

      // Only check fields on the same page
      if (field1.pageNumber !== field2.pageNumber) continue;

      // Check if rectangles overlap
      const field1Right = field1.pageX + field1.pageWidth;
      const field1Bottom = field1.pageY + field1.pageHeight;
      const field2Right = field2.pageX + field2.pageWidth;
      const field2Bottom = field2.pageY + field2.pageHeight;

      const overlapping = !(
        field1Right <= field2.pageX ||
        field2Right <= field1.pageX ||
        field1Bottom <= field2.pageY ||
        field2Bottom <= field1.pageY
      );

      if (overlapping) {
        overlaps.push({ field1, field2 });
      }
    }
  }

  return overlaps;
};

// Calculate field density per page
export const calculateFieldDensity = (fields: FieldFormType[]) => {
  const pageFieldCounts = fields.reduce<Record<number, number>>((acc, field) => {
    acc[field.pageNumber] = (acc[field.pageNumber] || 0) + 1;
    return acc;
  }, {});

  const densityWarnings: { pageNumber: number; fieldCount: number }[] = [];
  const maxRecommendedFields = 10; // Arbitrary threshold

  Object.entries(pageFieldCounts).forEach(([page, count]) => {
    if (count > maxRecommendedFields) {
      densityWarnings.push({ pageNumber: parseInt(page), fieldCount: count });
    }
  });

  return {
    pageFieldCounts,
    densityWarnings,
    totalFields: fields.length,
  };
};
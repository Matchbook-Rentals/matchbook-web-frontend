import type { Template, TemplateField, TemplateRecipient } from '../types';

/**
 * Validates if a template has all required fields and recipients
 */
export function validateTemplate(template: Partial<Template>): string[] {
  const errors: string[] = [];

  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }

  if (!template.type) {
    errors.push('Template type is required');
  }

  if (!template.fields || template.fields.length === 0) {
    errors.push('Template must have at least one field');
  }

  if (!template.recipients || template.recipients.length === 0) {
    errors.push('Template must have at least one recipient');
  }

  // Validate fields
  template.fields?.forEach((field, index) => {
    if (!field.label?.trim()) {
      errors.push(`Field ${index + 1}: Label is required`);
    }
    if (!field.type) {
      errors.push(`Field ${index + 1}: Type is required`);
    }
    if (!field.recipientId) {
      errors.push(`Field ${index + 1}: Recipient assignment is required`);
    }
  });

  // Validate recipients
  template.recipients?.forEach((recipient, index) => {
    if (!recipient.name?.trim()) {
      errors.push(`Recipient ${index + 1}: Name is required`);
    }
    if (!recipient.role) {
      errors.push(`Recipient ${index + 1}: Role is required`);
    }
  });

  return errors;
}

/**
 * Generates a unique field ID
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique recipient ID
 */
export function generateRecipientId(): string {
  return `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets the default field properties for a given field type
 */
export function getDefaultFieldProperties(type: TemplateField['type']): Partial<TemplateField> {
  switch (type) {
    case 'signature':
      return {
        width: 200,
        height: 60,
        required: true,
      };
    case 'text':
      return {
        width: 150,
        height: 30,
        required: false,
      };
    case 'date':
      return {
        width: 120,
        height: 30,
        required: false,
      };
    case 'checkbox':
      return {
        width: 20,
        height: 20,
        required: false,
      };
    case 'initial':
      return {
        width: 40,
        height: 30,
        required: false,
      };
    default:
      return {
        width: 100,
        height: 30,
        required: false,
      };
  }
}

/**
 * Gets the color for a recipient role
 */
export function getRecipientColor(role: TemplateRecipient['role']): string {
  switch (role) {
    case 'HOST':
      return '#0B6E6E';
    case 'RENTER':
      return '#fb8c00';
    case 'GUARANTOR':
      return '#9c27b0';
    case 'WITNESS':
      return '#4caf50';
    default:
      return '#757575';
  }
}

/**
 * Sorts recipients by their signing order
 */
export function sortRecipientsByOrder(recipients: TemplateRecipient[]): TemplateRecipient[] {
  return [...recipients].sort((a, b) => {
    const orderA = a.signingOrder ?? 999;
    const orderB = b.signingOrder ?? 999;
    return orderA - orderB;
  });
}

/**
 * Groups fields by recipient
 */
export function groupFieldsByRecipient(
  fields: TemplateField[], 
  recipients: TemplateRecipient[]
): Record<string, { recipient: TemplateRecipient; fields: TemplateField[] }> {
  const groups: Record<string, { recipient: TemplateRecipient; fields: TemplateField[] }> = {};

  recipients.forEach(recipient => {
    groups[recipient.id] = {
      recipient,
      fields: fields.filter(field => field.recipientId === recipient.id),
    };
  });

  return groups;
}

/**
 * Counts fields by type
 */
export function countFieldsByType(fields: TemplateField[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  fields.forEach(field => {
    counts[field.type] = (counts[field.type] || 0) + 1;
  });

  return counts;
}

/**
 * Checks if a template is ready for use (has all required components)
 */
export function isTemplateReady(template: Template): boolean {
  const errors = validateTemplate(template);
  return errors.length === 0 && template.fields.length > 0;
}

/**
 * Generates a template summary for display
 */
export function generateTemplateSummary(template: Template): string {
  const fieldCount = template.fields.length;
  const recipientCount = template.recipients.length;
  const signatureCount = template.fields.filter(f => f.type === 'signature').length;

  return `${fieldCount} fields, ${recipientCount} recipients, ${signatureCount} signatures`;
}

/**
 * Creates a copy of a template with new IDs
 */
export function duplicateTemplate(template: Template, newName?: string): Omit<Template, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...template,
    name: newName || `${template.name} (Copy)`,
    fields: template.fields.map(field => ({
      ...field,
      id: generateFieldId(),
    })),
    recipients: template.recipients.map(recipient => ({
      ...recipient,
      id: generateRecipientId(),
    })),
  };
}

/**
 * Finds fields that are missing required recipients
 */
export function findOrphanedFields(fields: TemplateField[], recipients: TemplateRecipient[]): TemplateField[] {
  const recipientIds = new Set(recipients.map(r => r.id));
  return fields.filter(field => !recipientIds.has(field.recipientId));
}

/**
 * Auto-assigns recipients to fields based on field labels
 */
export function autoAssignRecipients(fields: TemplateField[], recipients: TemplateRecipient[]): TemplateField[] {
  return fields.map(field => {
    if (field.recipientId) return field; // Already assigned

    const label = field.label.toLowerCase();
    
    // Try to match based on common patterns
    if (label.includes('tenant') || label.includes('renter') || label.includes('lessee')) {
      const renter = recipients.find(r => r.role === 'RENTER');
      if (renter) return { ...field, recipientId: renter.id };
    }
    
    if (label.includes('landlord') || label.includes('host') || label.includes('lessor')) {
      const host = recipients.find(r => r.role === 'HOST');
      if (host) return { ...field, recipientId: host.id };
    }
    
    if (label.includes('guarantor') || label.includes('cosigner')) {
      const guarantor = recipients.find(r => r.role === 'GUARANTOR');
      if (guarantor) return { ...field, recipientId: guarantor.id };
    }
    
    if (label.includes('witness')) {
      const witness = recipients.find(r => r.role === 'WITNESS');
      if (witness) return { ...field, recipientId: witness.id };
    }

    // Default to first recipient if no match found
    return field.recipientId ? field : { ...field, recipientId: recipients[0]?.id };
  });
}
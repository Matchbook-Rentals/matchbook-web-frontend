import { FieldFormType } from '@/components/pdf-editor/types';
import { Recipient } from '@/components/pdf-editor/RecipientManager';
import { getFieldLabel } from './fieldLabelUtils';

export interface NavigateToFieldParams {
  fieldId: string;
  fields: FieldFormType[];
  recipients: Recipient[];
  signedFields: Record<string, any>;
  legacyWorkflowState: string;
}

export interface NavigateToNextFieldParams {
  nextField: FieldFormType;
}

/**
 * Scrolls to a specific field, applies flash animation, and logs field information to API.
 *
 * @param params - Object containing field ID, fields array, recipients, signed fields, and workflow state
 */
export function navigateToField(params: NavigateToFieldParams): void {
  const { fieldId, fields, recipients, signedFields, legacyWorkflowState } = params;

  console.log('🎯 navigateToField: Starting navigation to field:', fieldId);

  const targetField = fields.find(f => f.formId === fieldId);
  if (!targetField) {
    console.warn('🎯 navigateToField: Field not found:', fieldId);
    return;
  }

  // Log field information to API for troubleshooting
  const logFieldClick = async () => {
    try {
      const recipient = recipients.find(r => r.id === targetField.signerEmail);
      const fieldValue = signedFields[targetField.formId];

      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'info',
          message: 'Field Click Debug Information',
          data: {
            fieldId: fieldId,
            field: {
              formId: targetField.formId,
              type: targetField.type,
              recipientIndex: targetField.recipientIndex,
              signerEmail: targetField.signerEmail,
              pageNumber: targetField.pageNumber,
              fieldMeta: targetField.fieldMeta,
              pageX: targetField.pageX,
              pageY: targetField.pageY,
              pageWidth: targetField.pageWidth,
              pageHeight: targetField.pageHeight
            },
            recipient: recipient ? {
              id: recipient.id,
              name: recipient.name,
              email: recipient.email,
              role: recipient.role,
              color: recipient.color
            } : null,
            fieldValue: fieldValue,
            hasValue: fieldValue !== undefined && fieldValue !== null && fieldValue !== '',
            generatedLabel: getFieldLabel(targetField),
            workflowState: legacyWorkflowState,
            totalFields: fields.length,
            timestamp: new Date().toISOString()
          }
        }),
      });
      console.log('✅ Field click logged to API');
    } catch (error) {
      console.error('❌ Failed to log field click:', error);
    }
  };

  // Log field information asynchronously
  logFieldClick();

  // Find the field element first
  const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement;
  console.log('🎯 navigateToField: Field element found:', !!fieldElement);

  if (fieldElement) {
    // Scroll directly to the field and center it in the viewport
    fieldElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    console.log('🎯 navigateToField: Scrolled to field');

    // Apply flash effect after scroll completes
    setTimeout(() => {
      // Store original styles
      const originalBg = fieldElement.style.backgroundColor;
      const originalTransition = fieldElement.style.transition;
      const originalBoxShadow = fieldElement.style.boxShadow;

      // Apply flash effect using inline styles
      fieldElement.style.transition = 'all 0.3s ease';
      fieldElement.style.backgroundColor = '#3c8787'; // brand color
      fieldElement.style.boxShadow = '0 0 20px rgba(60, 135, 135, 0.5)'; // Add glow effect
      console.log('🎯 navigateToField: Applied first flash');

      setTimeout(() => {
        fieldElement.style.backgroundColor = originalBg || '';
        fieldElement.style.boxShadow = originalBoxShadow || '';
        console.log('🎯 navigateToField: Removed first flash');

        setTimeout(() => {
          fieldElement.style.backgroundColor = '#3c8787';
          fieldElement.style.boxShadow = '0 0 20px rgba(60, 135, 135, 0.5)';
          console.log('🎯 navigateToField: Applied second flash');

          setTimeout(() => {
            fieldElement.style.backgroundColor = originalBg || '';
            fieldElement.style.boxShadow = originalBoxShadow || '';
            fieldElement.style.transition = originalTransition || '';
            console.log('🎯 navigateToField: Completed flashing');
          }, 300);
        }, 300);
      }, 300);
    }, 600); // Wait for scroll to complete
  } else {
    console.warn('🎯 navigateToField: Could not find field element, trying page fallback');

    // Fallback: scroll to page if field element not found
    const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${targetField.pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('🎯 navigateToField: Scrolled to page as fallback');
    }
  }
}

/**
 * Finds and navigates to the next unsigned field with flash animation.
 *
 * @param params - Object containing the next field to navigate to
 */
export function navigateToNextField(params: NavigateToNextFieldParams): void {
  const { nextField } = params;

  // Find the field element first
  const fieldElement = document.querySelector(`[data-field-id="${nextField.formId}"]`) as HTMLElement;

  if (fieldElement) {
    // Scroll directly to the field and center it in the viewport
    fieldElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Apply flash effect after scroll completes
    setTimeout(() => {
      // Store original styles
      const originalBg = fieldElement.style.backgroundColor;
      const originalTransition = fieldElement.style.transition;
      const originalBoxShadow = fieldElement.style.boxShadow;

      // Apply flash effect using inline styles
      fieldElement.style.transition = 'all 0.3s ease';
      fieldElement.style.backgroundColor = '#0B6E6E'; // secondaryBrand color
      fieldElement.style.boxShadow = '0 0 20px rgba(11, 110, 110, 0.5)'; // Add glow effect

      setTimeout(() => {
        fieldElement.style.backgroundColor = originalBg || '';
        fieldElement.style.boxShadow = originalBoxShadow || '';

        setTimeout(() => {
          fieldElement.style.backgroundColor = '#0B6E6E';
          fieldElement.style.boxShadow = '0 0 20px rgba(11, 110, 110, 0.5)';

          setTimeout(() => {
            fieldElement.style.backgroundColor = originalBg || '';
            fieldElement.style.boxShadow = originalBoxShadow || '';
            fieldElement.style.transition = originalTransition || '';
          }, 300);
        }, 300);
      }, 300);
    }, 600); // Wait for scroll to complete
  } else {
    console.warn('🎯 navigateToNextField: Could not find field element, trying page fallback');

    // Fallback: scroll to page if field element not found
    const pageElement = document.querySelector(`[data-pdf-viewer-page][data-page-number="${nextField.pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('🎯 navigateToNextField: Scrolled to page as fallback');
    }
  }
}

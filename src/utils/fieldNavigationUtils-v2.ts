import { FieldFormType } from '@/components/pdf-editor-v2/types';
import { Recipient } from '@/components/pdf-editor-v2/RecipientManager';
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
    scrollElementIntoViewDeep(fieldElement);
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
 * Scrolls every scrollable ancestor of `element` so the element is centered.
 * scrollIntoView only scrolls the nearest scrollable ancestor and doesn't play
 * nicely with transformed containers (MobilePDFWrapper uses a CSS transform
 * for pinch-zoom). Walking up and scrolling each ancestor explicitly makes the
 * behavior consistent regardless of where the scroll container lives.
 */
function getAbsoluteOffsetTop(element: HTMLElement): number {
  // Walk the offsetParent chain to get the element's position relative to the
  // document (not the viewport). This is stable regardless of how inner
  // scrollable ancestors are currently scrolled.
  let top = 0;
  let el: HTMLElement | null = element;
  while (el) {
    top += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  return top;
}

function scrollElementIntoViewDeep(element: HTMLElement): void {
  // Pass 1: scroll any inner scrollable ancestors instantly (e.g.
  // MobilePDFWrapper's horizontal scroller, <main> overflow-auto) so by the
  // time pass 2 runs, any inline offsets added by those containers are gone.
  let node: HTMLElement | null = element.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
    const canScrollX = /(auto|scroll|overlay)/.test(style.overflowX) && node.scrollWidth > node.clientWidth;
    if (canScrollY || canScrollX) {
      const containerRect = node.getBoundingClientRect();
      const elRect = element.getBoundingClientRect();
      if (canScrollY) {
        const delta = (elRect.top - containerRect.top) - (node.clientHeight - elRect.height) / 2;
        node.scrollTop += delta;
      }
      if (canScrollX) {
        const delta = (elRect.left - containerRect.left) - (node.clientWidth - elRect.width) / 2;
        node.scrollLeft += delta;
      }
    }
    node = node.parentElement;
  }

  // Pass 2: scroll the window using the element's absolute document offset so
  // we don't depend on rect.top (which resets to the viewport and can get
  // confused by transforms or weird ancestor positions). This consistently
  // works regardless of whether the viewport scroll is on <html> or <body>.
  const absoluteY = getAbsoluteOffsetTop(element);
  const targetY = Math.max(0, absoluteY - (window.innerHeight - element.offsetHeight) / 2);
  window.scrollTo({ top: targetY, behavior: 'smooth' });

  // Safety net: also call scrollIntoView in case an ancestor owns the scroll
  // and offsetTop-based math can't reach it.
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

/**
 * Detects a mobile-sized viewport (< Tailwind `md` breakpoint). Centralized
 * here so callers don't each need to pass a flag.
 */
function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

/**
 * Finds and navigates to the next unsigned field with flash animation.
 *
 * Defers the scroll by 300ms on mobile / 50ms on desktop. The delay covers
 * two things: waiting for any drawer-close animations to finish (mobile
 * sidebar) and letting React re-renders triggered by the caller's click
 * handler (e.g. `setIsContinuing`) settle so they can't race-cancel the
 * smooth scroll.
 *
 * @param params - Object containing the next field to navigate to
 */
export function navigateToNextField(params: NavigateToNextFieldParams): void {
  const { nextField } = params;
  const delay = isMobileViewport() ? 300 : 50;

  setTimeout(() => runScrollAndFlash(nextField), delay);
}

function runScrollAndFlash(nextField: FieldFormType): void {
  // Find the field element first
  const fieldElement = document.querySelector(`[data-field-id="${nextField.formId}"]`) as HTMLElement;

  if (fieldElement) {
    scrollElementIntoViewDeep(fieldElement);

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

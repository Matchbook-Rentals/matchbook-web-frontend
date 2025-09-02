# PDF Signing Workflow Issues

## Problem Summary

The main issue is with a PDF signing workflow in a lease creation route that has two phases:

1. **Document creation from template** - Works but pre-filled data not appearing in sidebar
2. **Signing stage** - Multiple issues:
   - "Next Action" button continues highlighting the first field even after it's signed (should move to next unsigned field)
   - Sidebar preview not updating correctly when fields are signed
   - **NEW ISSUE**: PDF fields are not displaying at all in the main document view

## Root Cause
State synchronization issues between parent component and PDFEditor due to multiple separate `signedFields` states. We implemented a React Context solution to centralize state management.

## Current Status
- ✅ **Fixed**: State desync using SignedFieldsContext
- ✅ **Fixed**: Sidebar now only counts SIGNATURE/INITIALS fields (not dates/other fields)  
- ✅ **Fixed**: Auto-fill SIGN_DATE when SIGNATURE signed, INITIAL_DATE when INITIALS signed
- ❌ **Still broken**: PDF fields not displaying in main document view
- ❌ **Still broken**: Next Action button behavior (needs verification)

## Key Files to Examine

### Primary Files:

1. **`/src/app/app/host/[listingId]/applications/[housingRequestId]/create-lease/page.tsx`**
   - Main route component with SignedFieldsProvider wrapper
   - Contains auto-population logic and signing workflow

2. **`/src/components/pdf-editor/PDFEditor.tsx`** 
   - Core PDF editing component using useSignedFields() hook
   - Contains getUnsignedFields() and handleSigningAction() functions
   - **Focus area**: Field rendering and Next Action button logic

3. **`/src/contexts/signed-fields-context.tsx`**
   - Centralized state management for signed fields
   - **Focus area**: Verify context is working correctly

4. **`/src/components/pdf-editor/HostSidebarFrame.tsx`**
   - Sidebar component showing field progress
   - Recently modified to hide non-signature fields and auto-fill dates

5. **`/src/components/pdf-editor/PDFEditorDocument.tsx`**
   - Wrapper component for PDFEditor
   - **Focus area**: Ensure props are passed correctly

## Immediate Next Steps:
1. Check browser console for any JavaScript errors preventing PDF field rendering
2. Verify the SignedFieldsProvider properly wraps the PDFEditor components 
3. Test the Next Action button after context implementation
4. Ensure field data is properly passed through the component hierarchy

## Most Critical Issue
The most critical issue right now is "no fields are displaying" in the PDF view, which suggests a fundamental rendering problem that needs immediate attention.

## Route for Testing
```
http://localhost:3000/app/host/2d83363c-2ff0-45a3-807f-81979b811524/applications/8c07745d-67f6-4bd5-b12e-c718aec2e313/create-lease?templates=24d557b7-f7d0-41c0-bfc1-b4baba18749e
```

## Technical Context
- React Context API for centralized state management
- PDF signing workflow with multiple stages (document creation → signing → completion)
- Field types: SIGNATURE, INITIALS, SIGN_DATE, INITIAL_DATE, NAME, EMAIL, TEXT, NUMBER, DATE
- Recipient-based field assignment (recipientIndex: 0 for host, 1 for renter)
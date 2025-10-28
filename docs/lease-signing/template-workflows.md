# Template Workflows

## Overview

Both template creation and template editing use the **same PDFEditor component** in template mode. Understanding this shared architecture is critical for maintaining consistency and avoiding layout issues.

## Template Creation Flow

### Location
- Page: `/src/app/app/host/[listingId]/leases/create/page.tsx`
- Step Component: `/src/features/lease-signing/steps/TemplateCreationStep.tsx`

### Workflow

1. **Upload Step** (lines 115-243 in TemplateCreationStep.tsx)
   - User selects document type (lease or addendum)
   - User inputs template name
   - User uploads PDF file
   - File validation and preview

2. **Edit Step** (lines 244-269 in TemplateCreationStep.tsx)
   - Renders PDFEditor in template mode
   - User adds form fields, recipients, signature blocks
   - User saves template

### PDFEditor Integration

```typescript
<div className="space-y-6">
  <PDFEditor
    initialPdfFile={uploadedFile}
    initialWorkflowState="template"
    templateType={templateType as 'lease' | 'addendum'}
    templateName={templateName}
    // ... other props
  />
</div>
```

**Key Pattern**: Simple wrapper with `space-y-6` class - no padding or fixed height constraints.

### Sidebar - Purpose and Implementation

**Component:** `TemplateSidebar` (`/src/components/pdf-editor/sidebars/TemplateSidebar.tsx`)

**Purpose:** Provides interactive tools for configuring recipients and adding fields to the PDF template.

**Contents:**

1. **RecipientManager** - Configure document signers
   - Add/remove recipients (Host, Renter, Additional Renters)
   - Each recipient assigned a unique color for field identification
   - Select active recipient to assign fields to
   - Shows recipient count and roles

2. **FieldSelector** - Drag-and-drop field palette
   - Organized by category:
     - **Signatures**: Signature blocks, Initial fields, Name
     - **Lease-specific**: Move In Date, Move Out Date, Rent Amount (host-only)
     - **Other**: Email, Text (host-only), Date
   - Drag fields from palette onto PDF
   - Fields automatically colored to match selected recipient
   - **Host-only restrictions**: TEXT and NUMBER fields can only be assigned to the host recipient

**Key Features:**
- Accordion UI for collapsing/expanding sections
- Visual feedback for active recipient selection
- Color-coded field assignment prevents confusion
- Real-time field count tracking
- **Recipient-based field filtering**: TEXT and NUMBER field buttons are disabled (grayed out) when a non-host recipient is selected

**Implementation Notes:**
- Same sidebar used for both template creation and editing
- Sidebar state persists across template saves
- Recipient changes automatically update field assignments
- Field palette is static - same options for all template types
- **Host-only validation**: Attempting to drag TEXT or NUMBER fields to non-host recipients triggers an error toast and prevents field creation

## Template Editing Flow

### Location
- Page: `/src/app/app/host/[listingId]/leases/[templateId]/edit/page.tsx`
- Client Component: `/src/app/app/host/[listingId]/leases/[templateId]/edit/template-edit-client.tsx`

### Workflow

1. **Load Existing Template**
   - Server component fetches template from database
   - Converts PDF file to base64 for client
   - Passes template data, fields, recipients

2. **Edit Template**
   - Client component converts base64 back to File object
   - Renders PDFEditor with existing template data
   - User modifies fields, recipients, signature blocks
   - User saves updates

### PDFEditor Integration

```typescript
<BrandAlertProvider>
  <PDFEditor
    initialPdfFile={pdfFile}
    initialWorkflowState="template"
    templateType={(template.type as 'lease' | 'addendum') || 'lease'}
    templateName={template.title}
    initialTemplate={template}
    initialFields={templateData?.fields || []}
    initialRecipients={templateData?.recipients || []}
    // ... other props
  />
</BrandAlertProvider>
```

**Key Pattern**: PDFEditor directly wrapped by BrandAlertProvider - no additional layout divs.

### Sidebar - Purpose and Implementation

**Component:** `TemplateSidebar` (`/src/components/pdf-editor/sidebars/TemplateSidebar.tsx`)

**Purpose:** Same as template creation - provides tools for modifying recipients and fields on existing template.

**Contents:**

1. **RecipientManager** - Modify document signers
   - Edit existing recipients or add new ones
   - Remove recipients (automatically removes their assigned fields)
   - Each recipient retains their color-coding from creation
   - Active recipient selection for field assignment

2. **FieldSelector** - Add/modify fields
   - Same field palette as creation flow (includes host-only restrictions)
   - Drag new fields onto PDF
   - Existing fields can be moved, resized, or deleted
   - Field properties editable via field inspector
   - **Host-only restrictions apply**: TEXT and NUMBER fields can only be assigned to host

**Key Features:**
- Pre-populated with existing recipients and their colors
- Existing fields load with their recipient assignments
- Removing a recipient shows confirmation if fields exist
- Field modifications save to `templateData.fields` array
- **Recipient-based field filtering**: TEXT/NUMBER buttons disabled when non-host selected

**Implementation Notes:**
- **Identical component** to template creation sidebar
- Differentiated by `initialFields` and `initialRecipients` props
- PDFEditor manages field state internally
- No visual difference between create/edit modes in sidebar
- Sidebar doesn't know if it's in "create" or "edit" mode - it's stateless
- **Same host-only validation** as creation flow

**Why Same Sidebar Works:**
- Template creation: Empty fields array, default recipients
- Template editing: Pre-populated fields array, existing recipients
- Same UI, different initial data - clean separation of concerns

## Critical Fix: Wrapper Styling Issue

### Problem (Fixed 2025-10-28)

Initially, template-edit-client.tsx wrapped PDFEditor with:

```typescript
<BrandAlertProvider>
  <div className="min-h-screen bg-[#f9f9f9] p-6">  {/* PROBLEMATIC */}
    <PDFEditor ... />
  </div>
</BrandAlertProvider>
```

This caused form fields to display in the top right corner instead of their correct positions.

### Root Cause

PDFEditor uses `calc(100vh - 100px)` for its height and has internal flex layouts. The extra wrapper with padding (`p-6`) interfered with these calculations:

1. PDFEditor expects to manage its own layout
2. The `calc(100vh - 100px)` height calculation breaks when wrapped with padding
3. Internal flex containers with fixed positioning render incorrectly
4. Result: fields appear in unexpected locations

### Solution

Remove the wrapper div entirely and let PDFEditor handle its own layout:

```typescript
<BrandAlertProvider>
  <PDFEditor ... />  {/* Clean integration */}
</BrandAlertProvider>
```

**Architectural Principle**: PDFEditor is a self-contained layout component. Do not wrap it with padding, fixed heights, or other layout-affecting containers.

## Comparison: Creation vs Editing

| Aspect | Template Creation | Template Editing |
|--------|------------------|------------------|
| **Component** | TemplateCreationStep | template-edit-client |
| **PDFEditor** | Same component | Same component |
| **Workflow State** | `template` | `template` |
| **Initial Data** | Empty (new file) | Pre-populated (existing template) |
| **Fields** | Empty array | Existing fields from template |
| **Recipients** | Empty array | Existing recipients from template |
| **Wrapper** | `<div className="space-y-6">` | None (direct BrandAlertProvider wrap) |
| **Props** | Minimal (new template) | Full (includes initialTemplate, initialFields, initialRecipients) |

## Dependencies

### Shared Dependencies
- **PDFEditor**: `@/components/pdf-editor/PDFEditor`
- **BrandAlertProvider**: `@/hooks/useBrandAlert`

### Template Creation Dependencies
- UI: Button, Input, Label, Card, Select (shadcn/ui)
- Icons: Upload, FileText, X (lucide-react)
- Utils: formatFileSize, clientLogger

### Template Editing Dependencies
- Next.js: useRouter (navigation)
- UI: toast (user feedback)
- API: `/api/pdf-templates/[id]` (PUT endpoint)

## Standalone vs Coupled

**TemplateCreationStep**: Relatively standalone
- Step 1 (Upload): Completely independent - just form inputs
- Step 2 (Edit): Tightly coupled to PDFEditor

**template-edit-client**: Moderately coupled
- Depends on server component for data fetching
- Depends on PDFEditor for editing functionality
- Depends on API route for saving updates

**Key Insight**: Both components are essentially thin wrappers around PDFEditor. The core functionality lives in PDFEditor itself, making it the critical shared dependency.

## Best Practices

1. **Always use PDFEditor in template mode for template operations**
   - Set `initialWorkflowState="template"`
   - Pass `templateType` as either 'lease' or 'addendum'

2. **Never wrap PDFEditor with padding or layout-affecting containers**
   - Let PDFEditor manage its own height and layout
   - Use BrandAlertProvider as the direct parent

3. **For editing, always pass existing data**
   - Include `initialTemplate`, `initialFields`, `initialRecipients`
   - PDFEditor will populate the editor with existing data

4. **Keep wrapper components thin**
   - Don't duplicate PDFEditor logic
   - Focus on data loading and saving
   - Let PDFEditor handle all UI/UX

## Related Documentation

- [PDFEditor Integration Guide](./pdf-editor-integration.md) - Detailed integration patterns
- [Component Reference](./component-reference.md) - Full prop documentation
- [Migration Guide](./migration-guide.md) - Historical context and architectural decisions

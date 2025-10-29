# PDFEditor Integration Guide

## Overview

PDFEditor (`/src/components/pdf-editor/PDFEditor.tsx`) is the core component for all PDF editing operations in the lease signing system. This guide covers proper integration patterns to avoid layout issues and ensure consistent behavior.

## Critical Integration Rule

**PDFEditor manages its own layout and must NOT be wrapped in containers with padding, fixed heights, or other layout-affecting styles.**

### Why This Matters

PDFEditor uses `calc(100vh - 100px)` for its container height and employs internal flex layouts with precise positioning. When wrapped with additional layout constraints:

1. Height calculations break
2. Internal flex containers misalign
3. Form fields render in unexpected positions (e.g., top right corner)
4. Scrolling behavior becomes unpredictable

## Correct Integration Patterns

### ✅ Pattern 1: Direct BrandAlertProvider Wrap (Recommended)

```typescript
<BrandAlertProvider>
  <PDFEditor
    initialPdfFile={file}
    initialWorkflowState="template"
    // ... other props
  />
</BrandAlertProvider>
```

**Used in**: template-edit-client.tsx (after 2025-10-28 fix)

### ✅ Pattern 2: Simple Space Wrapper

```typescript
<BrandAlertProvider>
  <div className="space-y-6">
    <PDFEditor
      initialPdfFile={file}
      initialWorkflowState="template"
      // ... other props
    />
  </div>
</BrandAlertProvider>
```

**Used in**: TemplateCreationStep.tsx

**Why this works**: `space-y-6` only adds vertical spacing between children. Since PDFEditor is likely the only child, no spacing is actually applied, and no layout constraints are imposed.

## Incorrect Integration Patterns

### ❌ Anti-Pattern: Wrapper with Padding

```typescript
<BrandAlertProvider>
  <div className="min-h-screen bg-[#f9f9f9] p-6">  {/* DON'T DO THIS */}
    <PDFEditor ... />
  </div>
</BrandAlertProvider>
```

**Problems**:
- `p-6` adds padding that breaks height calculations
- `min-h-screen` can interfere with PDFEditor's viewport calculations
- Background color is redundant (PDFEditor has its own)

### ❌ Anti-Pattern: Fixed Height Container

```typescript
<div style={{ height: '100vh' }}>  {/* DON'T DO THIS */}
  <PDFEditor ... />
</div>
```

**Problems**:
- Conflicts with PDFEditor's internal `calc(100vh - 100px)`
- Prevents PDFEditor from accounting for header/navbar space

### ❌ Anti-Pattern: Flex Container with Height Constraints

```typescript
<div className="flex flex-col h-screen">  {/* DON'T DO THIS */}
  <div className="flex-1">
    <PDFEditor ... />
  </div>
</div>
```

**Problems**:
- `flex-1` makes the container grow to fill space
- PDFEditor's fixed height calculations conflict with flex sizing

## Workflow States

PDFEditor supports three workflow states, each with specific use cases:

### 1. Template Mode

**Usage**: Creating or editing reusable lease templates

```typescript
<PDFEditor
  initialWorkflowState="template"
  templateType="lease" // or "addendum"
  templateName="Standard Lease Agreement"
  initialPdfFile={pdfFile}
  onSave={(data) => {
    // Save template to database
  }}
/>
```

**Features**:
- Add form fields (text, date, signature)
- Configure recipients (host, renter, co-signer)
- Set field properties (required, read-only, etc.)
- Field positioning and styling

**Field Type Restrictions**:
- **TEXT fields**: Host-only (disabled for renter recipients)
- **NUMBER fields**: Host-only (disabled for renter recipients)
- **All other fields**: Can be assigned to any recipient
- Attempting to assign host-only fields to renters triggers validation error

**Used in**:
- TemplateCreationStep.tsx
- template-edit-client.tsx

### 2. Document Mode

**Usage**: Creating specific lease documents from templates

**Key Concept**: Template creation and document creation use the same interface because **template creation is just front-loading the work of document creation**. Both provide full interactive editing capabilities.

```typescript
<PDFEditor
  initialWorkflowState="document"
  templateType="lease"
  initialPdfFile={pdfFile}
  initialTemplate={existingTemplate}
  initialFields={templateFields}
  // Pre-fill some fields
  onSave={(data) => {
    // Create document record
  }}
/>
```

**Features**:
- Same interactive editing as template mode (uses TemplateSidebar)
- Pre-populated fields from template and application data
- Host can add/remove/edit fields for this specific lease
- Full recipient management
- Field palette for adding new fields
- Last chance to customize before signing

**Used in**:
- Document creation flows
- Application-based lease creation

### 3. Signing Mode

**Usage**: Collecting signatures from participants

```typescript
<PDFEditor
  initialWorkflowState="signing"
  currentSignerId={userId}
  initialPdfFile={pdfFile}
  initialFields={documentFields}
  signingRole="renter" // or "host", "co-signer"
  onComplete={(data) => {
    // Submit signature
  }}
/>
```

**Features**:
- Read-only fields except for current signer's fields
- Signature pad integration
- Field validation before submission
- Multi-party signing coordination

**Used in**:
- Renter signing flows
- Host signing flows
- Co-signer signing flows

## Common Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `initialPdfFile` | File | The PDF file to edit/view |
| `initialWorkflowState` | 'template' \| 'document' \| 'signing' | Workflow mode |

### Template Mode Props

| Prop | Type | Description |
|------|------|-------------|
| `templateType` | 'lease' \| 'addendum' | Type of template |
| `templateName` | string | Display name for template |
| `initialTemplate` | object (optional) | Existing template data for editing |
| `initialFields` | array (optional) | Pre-existing fields |
| `initialRecipients` | array (optional) | Pre-configured recipients |

### Signing Mode Props

| Prop | Type | Description |
|------|------|-------------|
| `currentSignerId` | string | ID of the current signer |
| `signingRole` | 'host' \| 'renter' \| 'co-signer' | Role of current signer |

### Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `onSave` | function | Called when template/document is saved |
| `onComplete` | function | Called when signing is completed |
| `onCancel` | function | Called when user cancels operation |

## Field Type Reference

### Available Field Types

**Universal Field Types** (can be assigned to any recipient):
- **SIGNATURE** - Signature block (200×60px)
- **INITIALS** - Initials field (80×40px)
- **NAME** - Name field (200×40px)
- **EMAIL** - Email field (200×40px)
- **DATE** - Date picker (150×40px)
- **SIGN_DATE** - Auto-generated signing date (150×40px)
- **INITIAL_DATE** - Auto-generated initialing date (150×40px)

**Host-Only Field Types** (restricted to host recipient):
- **TEXT** - Free text input (200×40px) - *Host only*
- **NUMBER** - Numeric input (120×40px) - *Host only*

**Disabled Field Types** (commented out in UI):
- RADIO - Radio button
- CHECKBOX - Checkbox
- DROPDOWN - Dropdown select

### Field Restriction Rules

**Template Mode:**
- TEXT and NUMBER field buttons are disabled (grayed out) when a non-host recipient is selected
- Attempting to drag TEXT/NUMBER fields to non-host recipients shows error toast: "Text and Number fields can only be assigned to the host."
- Validation occurs in both FieldSelector UI and PDFEditor drop handler

**Document/Signing Modes:**
- Restrictions only apply during template creation/editing
- Once fields are in a document, they're fixed from the template
- All fields display and function normally regardless of type

## Troubleshooting

### Issue: Fields Appearing in Wrong Position

**Symptoms**:
- Form fields render in top right corner
- Fields don't align with PDF content
- Scrolling doesn't reveal fields properly

**Solution**:
Remove any wrapper divs with padding, margins, or height constraints. Wrap PDFEditor directly with BrandAlertProvider or use a simple `space-y-6` wrapper.

**Fixed in**: template-edit-client.tsx (2025-10-28)

### Issue: PDFEditor Not Taking Full Height

**Symptoms**:
- PDFEditor appears squashed
- Content is cut off
- Scrollbars appear unexpectedly

**Possible Causes**:
1. Parent container has height constraint
2. Flex container is fighting with PDFEditor's fixed height
3. Viewport calculations are incorrect

**Solution**:
Ensure PDFEditor is in a container that allows it to use `calc(100vh - 100px)` naturally. Remove flex or grid layouts from immediate parents.

### Issue: Multiple PDFEditors on Same Page

**Not Supported**: PDFEditor assumes it's the primary component on the page and uses viewport-based sizing. Don't render multiple PDFEditor instances simultaneously.

**Alternative**: Use a modal/dialog to show secondary PDFEditor instances, ensuring only one is rendered at a time.

## E-Signature Affirmation

### Purpose
Provides legally binding consent for electronic signature usage in compliance with ESIGN Act requirements.

### Behavior

**First Signature in Session:**
- BrandCheckbox appears with affirmation text in all tabs (Draw, Type, Saved)
- User must check: "By checking this box, I affirm that the signature above is a legally binding representation of my signature and constitutes my agreement to the terms of this document."
- Validation prevents signature submission without affirmation
- Toast error displayed if user attempts to sign without checking: "Affirmation Required - Please confirm the e-signature affirmation to continue"

**Subsequent Signatures:**
- Checkbox does not appear (session affirmation already recorded)
- User can sign immediately without re-confirming
- Session state persists across Draw, Type, and Saved tabs

### Implementation

**Component**: SignatureDialog.tsx (`/src/components/pdf-editor/SignatureDialog.tsx`)

**State Management:**
- `affirmationConfirmed`: Boolean tracking current checkbox state
- `hasAffirmedThisSession`: Boolean tracking if user has affirmed in this dialog session

**UI Component**: BrandCheckbox (`@/app/brandCheckbox`)
- Snazzy brand-styled checkbox with animations
- Accessible with proper ARIA attributes
- Consistent with application design system

**Validation**: Required checkbox validation in all handlers:
- `handleUseDrawnSignature()` - Draw tab
- `handleUseTypedSignature()` - Type tab
- `handleUseSavedSignature()` - Saved tab

**Scope**: Per-session (component instance), not persisted to database

### Legal Text

**Standard affirmation text:**
> By checking this box, I affirm that the signature above is a legally binding representation of my signature and constitutes my agreement to the terms of this document.

**For saved signatures:**
> By checking this box, I affirm that the signature I select is a legally binding representation of my signature and constitutes my agreement to the terms of this document.

## Layout Architecture

### Internal Structure

```
PDFEditor (height: calc(100vh - 100px))
├── Sidebar (overflow-y-auto, fixed/absolute positioning)
│   ├── Field palette
│   ├── Recipient configuration
│   └── Settings
└── Main Editor Area (flex-1)
    ├── PDF canvas
    ├── Field overlays (absolute positioning)
    └── Interaction handlers
```

The internal structure relies on:
- Fixed viewport-based height
- Absolute positioning for field overlays
- Flex layouts for sidebar and editor split
- Overflow handling for scrollable areas

**Any external layout constraints break this architecture.**

## Best Practices Checklist

When integrating PDFEditor:

- [ ] PDFEditor is wrapped only by BrandAlertProvider or a simple space-y wrapper
- [ ] No padding classes on parent containers
- [ ] No fixed height constraints on parent containers
- [ ] No flex/grid layouts affecting PDFEditor directly
- [ ] Only one PDFEditor rendered at a time
- [ ] Correct `initialWorkflowState` for the use case
- [ ] Required props are provided
- [ ] Appropriate callback handlers are implemented

## Real-World Examples

### Example 1: Template Editing (Correct)

```typescript
// template-edit-client.tsx (fixed version)
export default function TemplateEditClient({ template, pdfBase64 }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // ... file loading logic

  return (
    <BrandAlertProvider>
      <PDFEditor
        initialPdfFile={pdfFile}
        initialWorkflowState="template"
        templateType={template.type as 'lease' | 'addendum'}
        templateName={template.title}
        initialTemplate={template}
        initialFields={template.templateData?.fields || []}
        initialRecipients={template.templateData?.recipients || []}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </BrandAlertProvider>
  );
}
```

### Example 2: Template Creation (Correct)

```typescript
// TemplateCreationStep.tsx
const renderEditStep = () => (
  <div className="space-y-6">
    <PDFEditor
      initialPdfFile={uploadedFile}
      initialWorkflowState="template"
      templateType={templateType as 'lease' | 'addendum'}
      templateName={templateName}
      listingId={listingId}
      onSave={handleTemplateSave}
      onCancel={handleCancel}
    />
  </div>
);
```

## Related Documentation

- [Template Workflows](./template-workflows.md) - Detailed template creation and editing flows
- [Component Reference](./component-reference.md) - Full prop documentation
- [Migration Guide](./migration-guide.md) - Historical context for architectural decisions

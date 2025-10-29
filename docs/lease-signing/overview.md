# Lease Signing Feature Overview

## Introduction

The lease signing feature is a comprehensive document workflow system that enables hosts to create, customize, and send lease agreements and addendums to renters for electronic signature.

## Architecture

The lease signing system is built on a modular step-based architecture that separates concerns and enables flexible workflow composition.

### Core Components

1. **PDFEditor** (`/src/components/pdf-editor/PDFEditor.tsx`)
   - Central component for all PDF editing operations
   - Supports multiple workflow states: template creation, document creation, signing
   - Used by both template creation and template editing flows

2. **Step Components** (`/src/features/lease-signing/steps/`)
   - Modular workflow steps that can be composed together
   - Each step handles a specific phase of the document lifecycle
   - Examples: TemplateCreationStep, DocumentCreationStep, SignerXStep

3. **Workflow Orchestration**
   - Steps are coordinated through parent components
   - Each workflow (host creation, renter signing) uses relevant steps

## Key Workflows

### Template Management

#### Template Creation
**Route:** `/app/host/[listingId]/leases/create`

**Components:**
- Page: `/src/app/app/host/[listingId]/leases/create/page.tsx`
- Step: `/src/features/lease-signing/steps/TemplateCreationStep.tsx`
- Editor: `/src/components/pdf-editor/PDFEditor.tsx`

**Description:** Host uploads PDF and configures signature blocks to create a reusable template

#### Template Editing
**Route:** `/app/host/[listingId]/leases/[templateId]/edit`

**Components:**
- Page: `/src/app/app/host/[listingId]/leases/[templateId]/edit/page.tsx`
- Client: `/src/app/app/host/[listingId]/leases/[templateId]/edit/template-edit-client.tsx`
- Editor: `/src/components/pdf-editor/PDFEditor.tsx`

**Description:** Host modifies existing template signature blocks and recipients (uses same PDFEditor as creation)

#### Template List/Management
**Route:** `/app/host/[listingId]/leases`

**Components:**
- Page: `/src/app/app/host/[listingId]/leases/page.tsx`
- Client: `/src/app/app/host/[listingId]/leases/leases-page-client.tsx`

**Description:** Host views all templates, sees completion status, and manages templates

---

### Document Creation

#### From Application (Template Selection)
**Route:** `/app/host/[listingId]/applications/[housingRequestId]/create-lease`

**Components:**
- Page: `/src/app/app/host/[listingId]/applications/[housingRequestId]/create-lease/page.tsx`
- Dialog: `/src/components/LeaseSelectionDialog.tsx`
- Editor: `/src/components/pdf-editor/PDFEditorDocument.tsx`
- Sidebar: `/src/components/pdf-editor/HostSidebarFrame.tsx`

**Description:** Host selects template(s) to create document instance for specific renter application

#### Document Creation Step (Generic)
**Component:**
- Step: `/src/features/lease-signing/steps/DocumentCreationStep.tsx`

**Description:** Generic document creation step used in various workflows

---

### Signing Process

#### Host Signing
**Route:** `/app/host/[listingId]/applications/[housingRequestId]/create-lease` (continues in same flow)

**Components:**
- Editor: `/src/components/pdf-editor/PDFEditorDocument.tsx` (signer1 state)
- Sidebar: `/src/components/pdf-editor/HostSidebarFrame.tsx`

**Description:** Host signs their fields immediately after creating document from template

#### Renter Signing (Primary Flow)
**Route:** `/app/rent/match/[matchId]/lease-signing`

**Components:**
- Page: `/src/app/app/rent/match/[matchId]/lease-signing/page.tsx`
- Client: `/src/app/app/rent/match/[matchId]/lease-signing-client.tsx`
- Editor: `/src/components/pdf-editor/PDFEditorSigner.tsx`
- Sidebar: `/src/app/app/rent/match/[matchId]/signing-sidebar.tsx`
- Booking Summary: `/src/app/app/rent/match/[matchId]/booking-summary-sidebar.tsx`

**Description:** Renter reviews and signs lease document with integrated payment flow

#### Co-signer/Additional Renter Signing
**Component:**
- Step: `/src/features/lease-signing/steps/SignerXStep.tsx`

**Description:** Handles additional signers beyond primary host and renter

---

### Awaiting Signature Views

#### Awaiting Lease Document (Renter)
**Route:** `/app/rent/match/[matchId]/awaiting-lease`

**Components:**
- Page: `/src/app/app/rent/match/[matchId]/awaiting-lease/page.tsx`
- Client: `/src/app/app/rent/match/[matchId]/awaiting-lease/awaiting-lease-client.tsx`

**Description:** Renter sees waiting screen while host prepares lease document

#### Pending Host Signature (Renter)
**Route:** `/app/rent/match/[matchId]/pending-host-signature`

**Components:**
- Page: `/src/app/app/rent/match/[matchId]/pending-host-signature/page.tsx`
- Client: `/src/app/app/rent/match/[matchId]/pending-host-signature/pending-host-signature-client.tsx`

**Description:** Renter has signed and paid, waiting for host to countersign

---

### Shared Components

#### PDF Editor Core
- Main Editor: `/src/components/pdf-editor/PDFEditor.tsx`
- Document Editor: `/src/components/pdf-editor/PDFEditorDocument.tsx`
- Signer Editor: `/src/components/pdf-editor/PDFEditorSigner.tsx`
- PDF Viewer: `/src/components/pdf-editor/PDFViewer.tsx`

#### Sidebars
- Template Sidebar: `/src/components/pdf-editor/sidebars/TemplateSidebar.tsx` (used for both template creation and document creation - template creation is just front-loading the work of document creation)
- Document Sidebar: `/src/components/pdf-editor/sidebars/DocumentSidebar.tsx` (read-only reference view, currently not used in main workflows)
- Signing Sidebar: `/src/components/pdf-editor/sidebars/SigningSidebar.tsx`

#### Field Components
- Signable Field: `/src/components/pdf-editor/SignableField.tsx`
- Signature Dialog: `/src/components/pdf-editor/SignatureDialog.tsx` (includes e-signature affirmation)
- Signature Canvas: `/src/components/pdf-editor/SignatureCanvas.tsx`

#### Review Components
- Lease Review Modal: `/src/components/lease-review/LeaseReviewModal.tsx`
- Payment Review: `/src/components/payment-review/PaymentReviewScreen.tsx`

## Documentation Structure

- **[Feature Specification](./feature-spec.md)** - Detailed feature requirements and usage
- **[Migration Guide](./migration-guide.md)** - Architecture evolution and refactoring history
- **[Template Workflows](./template-workflows.md)** - Template creation vs editing flows
- **[PDFEditor Integration](./pdf-editor-integration.md)** - How to properly integrate PDFEditor
- **[Component Reference](./component-reference.md)** - API documentation for step components

## Getting Started

For implementing new workflows or modifying existing ones:
1. Read the [PDFEditor Integration Guide](./pdf-editor-integration.md) first
2. Review relevant step components in [Component Reference](./component-reference.md)
3. Check [Template Workflows](./template-workflows.md) for examples
4. Consult [Migration Guide](./migration-guide.md) for architectural decisions and patterns

# Component Reference

## Step Components

The lease signing feature uses modular step components that can be composed together to create different workflows.

### TemplateCreationStep

**Location**: `/src/features/lease-signing/steps/TemplateCreationStep.tsx`

**Purpose**: Two-step wizard for creating new lease templates

#### Props

```typescript
interface TemplateCreationStepProps {
  listingId: string;          // ID of the associated listing
  onComplete: () => void;      // Called when template is saved
  onCancel: () => void;        // Called when user cancels
}
```

#### Features

**Step 1: Upload**
- Document type selection (lease or addendum)
- Template name input with validation
- PDF file upload with drag-and-drop
- File validation (type, size)
- File preview with size display

**Step 2: Edit**
- PDFEditor integration for field placement
- Recipient configuration
- Template saving

#### Usage Example

```typescript
import { TemplateCreationStep } from "@/features/lease-signing/steps/TemplateCreationStep";

function CreateTemplatePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-6">
      <TemplateCreationStep
        listingId={listingId}
        onComplete={() => router.push(`/app/host/${listingId}/leases`)}
        onCancel={() => router.push(`/app/host/${listingId}/leases`)}
      />
    </div>
  );
}
```

#### Dependencies

- **UI Components**: Button, Input, Label, Card, Select
- **Icons**: Upload, FileText, X (lucide-react)
- **Core**: PDFEditor, BrandAlertProvider
- **Utils**: formatFileSize, clientLogger

#### Standalone Status

**Moderately Standalone**
- Upload step is fully independent
- Edit step requires PDFEditor
- No dependencies on parent state beyond props

### DocumentCreationStep

**Location**: `/src/features/lease-signing/steps/DocumentCreationStep.tsx`

**Purpose**: Create specific lease documents from templates

#### Props

```typescript
interface DocumentCreationStepProps {
  template: Template;              // The template to use
  listingId: string;               // Associated listing
  applicationId?: string;          // Optional application context
  prefilledFields?: Field[];       // Fields to pre-populate
  onComplete: (documentId: string) => void;  // Called with new document ID
  onCancel: () => void;            // Called when user cancels
}
```

#### Features

- Load template and convert to document mode
- Pre-fill known values (host info, property address)
- Allow host to fill additional fields
- Prepare document for renter signing

#### Usage Example

```typescript
import { DocumentCreationStep } from "@/features/lease-signing/steps/DocumentCreationStep";

function CreateLeasePage({ template, applicationData }) {
  return (
    <DocumentCreationStep
      template={template}
      listingId={applicationData.listingId}
      applicationId={applicationData.id}
      prefilledFields={extractFieldsFromApplication(applicationData)}
      onComplete={(docId) => router.push(`/app/host/documents/${docId}`)}
      onCancel={() => router.back()}
    />
  );
}
```

#### Sidebar - Purpose and Implementation

**Component:** `TemplateSidebar` (`/src/components/pdf-editor/sidebars/TemplateSidebar.tsx`)

**Purpose:** Provides an interactive editing interface for customizing lease documents from templates. Template creation and document creation use the same interface because **template creation is just front-loading the work of document creation**.

**Key Concept:**
- **Template Creation** = Pre-configuring a reusable lease structure (fields, recipients, layout)
- **Document Creation** = Completing/customizing a template for a specific lease instance
- Both use the same interactive editing interface because they're the same activity at different workflow stages

**Contents:**

1. **Recipient Manager**
   - Add/edit/remove recipients (Host, Renter, Additional Renter)
   - Assign colors to recipients
   - Set signing order
   - Fully interactive during document creation

2. **Field Selector Palette**
   - Drag-and-drop field placement on PDF
   - Field types: TEXT, NUMBER, SIGNATURE, INITIALS, NAME, EMAIL, DATE, etc.
   - Field configuration (labels, required status, recipient assignment)
   - Host-only field restrictions for TEXT and NUMBER types

3. **Field Management**
   - Edit existing field properties
   - Delete fields
   - Reposition fields on the PDF
   - Navigate to field locations

**Key Features:**
- **Interactive Editing**: Full field creation and modification capabilities
- **Template Customization**: Hosts can add/remove fields to fit specific lease scenarios
- **Recipient Flexibility**: Adjust recipients based on actual participants in the lease
- **Last Chance Edits**: Document creation step is the final opportunity to customize before signing

**Implementation Notes:**
- Used in both `workflow.isTemplatePhase()` and `workflow.isDocumentPhase()`
- Same component, same capabilities - only difference is workflow context
- Document creation may have pre-filled values from application data
- All template editing tools remain available during document creation

**Field Type Restrictions:**
All fields from the template are displayed, including:
- **Host-only fields**: TEXT and NUMBER fields (can only be assigned to host during template creation)
- **Universal fields**: SIGNATURE, INITIALS, NAME, EMAIL, DATE (can be assigned to any recipient)
- Document sidebar shows all fields regardless of type - restrictions only apply during template configuration

### SignerXStep

**Location**: `/src/features/lease-signing/steps/SignerXStep.tsx`

**Purpose**: Collect signatures from participants

#### Props

```typescript
interface SignerXStepProps {
  document: Document;              // The document to sign
  currentUser: User;               // Current signing user
  signingRole: 'host' | 'renter' | 'co-signer';  // User's role
  onComplete: () => void;          // Called when signature submitted
  onDecline?: () => void;          // Optional decline handler
}
```

#### Features

- Display read-only document with highlights for user's fields
- Signature pad integration with e-signature affirmation
- E-signature affirmation requirement (once per signing session)
- Legal consent checkbox before first signature submission using BrandCheckbox
- Session-based affirmation (subsequent signatures don't require re-confirmation)
- Required field validation
- Submission with signature data

#### Usage Example

```typescript
import { SignerXStep } from "@/features/lease-signing/steps/SignerXStep";

function SignLeasePage({ document, currentUser }) {
  return (
    <SignerXStep
      document={document}
      currentUser={currentUser}
      signingRole="renter"
      onComplete={() => {
        toast({ title: "Document signed successfully" });
        router.push("/app/rent/leases");
      }}
      onDecline={() => {
        // Handle decline flow
      }}
    />
  );
}
```

## Client Components

### template-edit-client

**Location**: `/src/app/app/host/[listingId]/leases/[templateId]/edit/template-edit-client.tsx`

**Purpose**: Edit existing lease templates

#### Props

```typescript
interface TemplateEditClientProps {
  template: {
    id: string;
    title: string;
    type: string;
    templateData: any;
    pdfFileName: string;
    pdfFileUrl: string;
    updatedAt: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
  };
  pdfBase64: string | null;     // Base64-encoded PDF
  listingId: string;
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;
}
```

#### Features

- Load existing template from database
- Convert base64 PDF to File object
- Render PDFEditor with pre-populated fields
- Save template updates via API

#### Internal State

```typescript
const [pdfFile, setPdfFile] = useState<File | null>(null);
const [loading, setLoading] = useState(true);
```

#### API Integration

Updates template via `PUT /api/pdf-templates/[id]` with:
```typescript
{
  title: string;
  type: 'lease' | 'addendum';
  listingId: string;
  fields: Field[];
  recipients: Recipient[];
}
```

#### Usage

```typescript
// In page.tsx (server component)
import TemplateEditClient from "./template-edit-client";

export default async function EditTemplatePage({ params }) {
  const template = await getTemplate(params.templateId);
  const pdfBase64 = await getPdfAsBase64(template.pdfFileUrl);

  return (
    <TemplateEditClient
      template={template}
      pdfBase64={pdfBase64}
      listingId={params.listingId}
    />
  );
}
```

## Core Component: PDFEditor

**Location**: `/src/components/pdf-editor/PDFEditor.tsx`

**Purpose**: Universal PDF editing component for all workflows

See [PDFEditor Integration Guide](./pdf-editor-integration.md) for detailed documentation.

### Key Props

```typescript
interface PDFEditorProps {
  // Required
  initialPdfFile: File;
  initialWorkflowState: 'template' | 'document' | 'signing';

  // Template Mode
  templateType?: 'lease' | 'addendum';
  templateName?: string;
  initialTemplate?: Template;
  initialFields?: Field[];
  initialRecipients?: Recipient[];

  // Document Mode
  documentData?: Document;

  // Signing Mode
  currentSignerId?: string;
  signingRole?: 'host' | 'renter' | 'co-signer';

  // Context
  listingId?: string;
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;

  // Callbacks
  onSave?: (data: SaveData) => void;
  onComplete?: (data: CompleteData) => void;
  onCancel?: () => void;
}
```

### Workflow States

1. **Template Mode**: Create/edit reusable templates
2. **Document Mode**: Create specific documents from templates
3. **Signing Mode**: Collect signatures from participants

## Provider Components

### BrandAlertProvider

**Location**: `/src/hooks/useBrandAlert.tsx`

**Purpose**: Global alert/notification system for lease workflows

#### Usage

Wrap PDFEditor and related components:

```typescript
<BrandAlertProvider>
  <PDFEditor ... />
</BrandAlertProvider>
```

#### Features

- Displays alerts within the PDF editor context
- Styled to match brand colors
- Handles error, warning, info, success states
- Automatic dismissal with timeout

## API Routes

### PDF Templates

#### GET /api/pdf-templates
List all templates for a listing

#### POST /api/pdf-templates
Create new template

**Body**:
```typescript
{
  title: string;
  type: 'lease' | 'addendum';
  listingId: string;
  pdfFile: File;
  fields: Field[];
  recipients: Recipient[];
}
```

#### GET /api/pdf-templates/[id]
Get single template

#### PUT /api/pdf-templates/[id]
Update template

**Body**:
```typescript
{
  title?: string;
  type?: 'lease' | 'addendum';
  listingId: string;
  fields?: Field[];
  recipients?: Recipient[];
}
```

#### DELETE /api/pdf-templates/[id]
Delete template

### Documents

#### POST /api/lease-documents
Create document from template

**Body**:
```typescript
{
  templateId: string;
  listingId: string;
  applicationId?: string;
  fields: Field[];  // With values filled in
}
```

#### PUT /api/lease-documents/[id]/sign
Submit signature

**Body**:
```typescript
{
  signerId: string;
  signingRole: 'host' | 'renter' | 'co-signer';
  fieldValues: Record<string, any>;
  signature: string;  // Base64 signature image
}
```

## Type Definitions

### Field

```typescript
interface Field {
  id: string;
  type: 'text' | 'date' | 'signature' | 'checkbox';
  label: string;
  x: number;        // Position on PDF (percentage)
  y: number;
  width: number;
  height: number;
  page: number;     // PDF page number (0-indexed)
  required: boolean;
  readOnly?: boolean;
  value?: any;
  recipientId?: string;  // Which recipient can fill this
}
```

### Recipient

```typescript
interface Recipient {
  id: string;
  role: 'host' | 'renter' | 'co-signer';
  email?: string;
  name?: string;
  order: number;    // Signing order
}
```

### Template

```typescript
interface Template {
  id: string;
  title: string;
  type: 'lease' | 'addendum';
  pdfFileName: string;
  pdfFileUrl: string;
  templateData: {
    fields: Field[];
    recipients: Recipient[];
  };
  listingId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Common Patterns

### Pattern: Loading State

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      // Load data
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

if (loading) {
  return <LoadingSpinner />;
}
```

### Pattern: Error Handling

```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    toast({
      title: "Operation failed",
      description: error.error || "Please try again",
      variant: "destructive",
    });
    return;
  }

  const result = await response.json();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  toast({
    title: "Error",
    description: "Check your connection and try again",
    variant: "destructive",
  });
}
```

### Pattern: File Conversion (Base64 to File)

```typescript
const convertBase64ToFile = (base64: string, fileName: string): File => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return new File([blob], fileName, { type: 'application/pdf' });
};
```

## Related Documentation

- [Overview](./overview.md) - Feature overview and architecture
- [Template Workflows](./template-workflows.md) - Detailed workflow documentation
- [PDFEditor Integration](./pdf-editor-integration.md) - Integration patterns and best practices
- [Feature Specification](./feature-spec.md) - Requirements and usage examples

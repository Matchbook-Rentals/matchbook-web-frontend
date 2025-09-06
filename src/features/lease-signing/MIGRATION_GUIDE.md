# Lease Signing Workflow Migration Guide

## Overview
This guide documents the refactoring of the lease signing feature from a monolithic component with hardcoded states to a clean, maintainable system following "Declarative Functional Decomposition" principles.

## Key Changes

### 1. Workflow State Architecture

**Before:**
```typescript
// Hardcoded states in PDFEditor.tsx
type WorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';
```

**After:**
```typescript
// Dynamic workflow with proper phases
type WorkflowPhase = 'selection' | 'template' | 'document' | 'signing' | 'success';

// Dynamic signer support
interface SignerState {
  currentSignerIndex: number;
  totalSigners: number;
  signersCompleted: string[];
  signingOrder: string[];
}
```

### 2. Component Structure

**Before:**
- Single 3,929-line PDFEditor.tsx component
- Mixed concerns (UI, business logic, state management)
- Complex conditionals and switch statements

**After:**
- Decomposed into semantic components and helpers
- Clean separation of concerns
- Maximum 10-line functions following declarative principles

### 3. File Organization

```
src/features/lease-signing/
├── types/
│   ├── workflow.types.ts        # Unified workflow types
│   ├── template.types.ts
│   ├── document.types.ts
│   └── signing.types.ts
├── hooks/
│   ├── useWorkflowStateMachine.ts  # Main workflow state machine
│   ├── useLeaseWorkflow.ts         # Legacy (to be deprecated)
│   ├── useTemplateManager.ts
│   └── useSigningManager.ts
├── utils/
│   ├── workflowHelpers.ts          # Semantic workflow helpers
│   ├── fieldDecomposition.ts       # Field management helpers
│   ├── signatureDecomposition.ts   # Signature management helpers
│   └── ... (existing utils)
├── adapters/
│   └── workflowAdapter.ts          # Migration compatibility layer
├── steps/
│   ├── TemplateCreationStep.tsx
│   ├── DocumentCreationStep.tsx
│   ├── SignerXStep.tsx
│   └── SuccessStep.tsx             # New success phase component
└── page.tsx
```

## Migration Steps

### Phase 1: Update Imports
Replace old imports with new workflow system:

```typescript
// Before
import { useLeaseWorkflow } from './hooks/useLeaseWorkflow';

// After
import { useWorkflowStateMachine } from './hooks/useWorkflowStateMachine';
import { 
  isEditablePhase, 
  shouldShowField,
  getFieldsForCurrentSigner 
} from './utils/workflowHelpers';
```

### Phase 2: Replace State Management

```typescript
// Before
const [workflowState, setWorkflowState] = useState<WorkflowState>('selection');
if (workflowState === 'signer1') { /* ... */ }

// After
const workflow = useWorkflowStateMachine('selection');
if (workflow.isSigningPhase() && workflow.isFirstSigner()) { /* ... */ }
```

### Phase 3: Use Semantic Functions

```typescript
// Before (inline conditionals)
if (workflowState === 'template' || workflowState === 'document') {
  // Show field borders
}

// After (semantic helpers)
if (shouldShowFieldBorders(workflow.state.phase)) {
  // Show field borders
}
```

### Phase 4: Handle Dynamic Signers

```typescript
// Before (hardcoded)
if (workflowState === 'signer1') {
  // Handle first signer
} else if (workflowState === 'signer2') {
  // Handle second signer
}

// After (dynamic)
const signerLabel = getSignerLabel(
  workflow.getCurrentSignerIndex(),
  workflow.getTotalSigners()
);
// Handle current signer dynamically
```

## Semantic Helper Examples

### Field Management
```typescript
// Instead of complex inline logic
const fields = getFieldsForCurrentSigner(allFields, workflow.getCurrentSignerIndex());
const incompleteFields = getIncompleteFields(fields, signedFields);
const progress = calculateFieldProgress(fields, signedFields);
const canProceed = areAllRequiredFieldsSigned(fields, signedFields);
```

### Signature Management
```typescript
// Clean signature operations
const unsignedFields = getUnsignedSignatureFields(fields, signedFields);
const nextField = getNextUnsignedField(fields, signedFields);
const isComplete = areAllSignaturesComplete(fields, signedFields);
```

### Workflow Transitions
```typescript
// Clear transition logic
if (workflow.canTransitionForward() && canTransitionFromDocument(documentId, recipients.length)) {
  workflow.dispatch({ type: 'START_SIGNING', documentId, signerCount: recipients.length });
}
```

## Benefits of Refactoring

1. **Maintainability**: Small, focused functions are easier to understand and modify
2. **Testability**: Pure functions can be tested in isolation
3. **Scalability**: Dynamic signer support allows unlimited signers
4. **Readability**: Code reads like documentation
5. **Reusability**: Semantic helpers can be used across components

## Backward Compatibility

The `workflowAdapter.ts` provides compatibility during migration:

```typescript
import { legacyStateToPhase, phaseToLegacyState } from './adapters/workflowAdapter';

// Convert between old and new systems
const newPhase = legacyStateToPhase('signer1'); // Returns 'signing'
const legacyState = phaseToLegacyState('signing', 0); // Returns 'signer1'
```

## Next Steps

1. Gradually migrate PDFEditor.tsx to use new workflow system
2. Extract remaining large functions into semantic helpers
3. Create unit tests for all helper functions
4. Remove legacy code once migration is complete
5. Document API changes for consumers

## Code Style Guidelines

Follow "Declarative Functional Decomposition":
- **10-line maximum** per function
- **Semantic naming** - function names ARE the documentation
- **Tell, Don't Ask** - use `isMapAvailable()` not `mapRef.current !== null`
- **Vertical reading** - main functions read top-to-bottom like prose
- **No magic values** - extract all constants
- **Radical decomposition** - every logical step gets its own function
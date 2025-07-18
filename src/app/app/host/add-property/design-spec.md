# Test-Driven Development (TDD) Plan for Listing Creation Rewrite

Below is a comprehensive **Test-Driven Development (TDD) Plan** for rewriting the listing creation codebase as outlined in the previous response. This plan follows strict TDD principles: for each step, we'll write failing tests first (Red phase), implement the minimal code to make them pass (Green phase), and then refactor if needed while keeping tests green. The plan is **incremental**, breaking the rewrite into small, self-contained steps. Each step builds on the previous one, ensuring the application remains functional and testable throughout (e.g., you can run the app after each step without breaking the UI).

We'll assume:
- You're using Jest + React Testing Library for tests.
- The new module is in `src/features/listing-creation/`.
- Start with an empty folder structure; copy over existing logic only as needed during implementation.
- No UI changes: Tests focus on logic, state, and behavior, not rendering (though integration tests will verify outputs indirectly).
- After each step, run the full test suite and app to confirm nothing breaks. Proceed to the next step only when all tests are green.

This plan covers the key refactors: module setup, types/schemas, state management, validation, services/hooks, and component integration. It prioritizes foundational pieces first (e.g., types) for incremental progress.

---

### Step 1: Set Up Module Structure and Basic Types ✅ **COMPLETED**
**Goal**: Create the folder structure and a basic types file. This establishes the foundation without touching existing code. Tests verify type safety and basic interfaces.

**Status**: ✅ **COMPLETED** - All tests passing, comprehensive type system implemented

**Files Created**:
- `src/features/listing-creation/types/index.ts` - Consolidated type definitions with JSDoc documentation
- `test/integration/features/listing-creation/types/types.test.ts` - Comprehensive test suite (5 tests passing)
- Directory structure: `src/features/listing-creation/{types,schemas,utils,stores,hooks,components,__tests__}/`

**Types Implemented**:
- **Main Data Structures**: `ListingData`, `DraftData` (extracted from `src/lib/listing-actions-helpers.ts`)
- **Form Step Interfaces**: `ListingHighlights`, `ListingLocation`, `ListingRooms`, `ListingBasics`, `ListingPricing`
- **Utility Types**: `MonthlyPricing`, `NullableListingImage`, `ListingFormData`, `ListingCreationState`
- **Type Unions**: `FormStepData`, `ValidationResult`

**Test Coverage**:
- ✅ DraftData with optional fields
- ✅ ListingData with required fields  
- ✅ MonthlyPricing with correct field types
- ✅ Complex DraftData with all fields
- ✅ ListingData with images and pricing

**Ready for Step 2**: Zod schema implementation can now begin

---

### Step 2: Implement Zod Schemas for Validation
**Goal**: Add Zod schemas for key form sections (e.g., highlights, location). This introduces type-safe validation incrementally, starting with one schema.

**Red Phase**: Write failing tests in `src/features/listing-creation/schemas/listingSchemas.test.ts`.
```ts
import { highlightsSchema, fullFormSchema } from './listingSchemas';

describe('Listing Schemas', () => {
  it('should fail validation for invalid highlights', () => {
    const invalidData = { category: '', petsAllowed: null };
    const result = highlightsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toBe('Property type required');
  });

  it('should pass validation for valid highlights', () => {
    const validData = { category: 'Apartment', petsAllowed: true, furnished: false };
    const result = highlightsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should define fullFormSchema that combines subschemas', () => {
    // This fails initially if full schema is missing
    const data = { highlights: { category: 'Apartment', petsAllowed: true, furnished: false } /* add more */ };
    const result = fullFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

**Green Phase**: Create `src/features/listing-creation/schemas/listingSchemas.ts` with Zod schemas (e.g., `export const highlightsSchema = z.object({ category: z.string().min(1, 'Property type required'), /* etc. */ }); export const fullFormSchema = z.object({ highlights: highlightsSchema, /* add others incrementally */ });`). Implement one schema at a time until tests pass. Refactor: Extract common refinements into helpers.

**When Green**: Proceed to Step 3. (Schemas are ready for later validation steps.)

---

### Step 3: Build Initializers for Form Defaults
**Goal**: Create utility functions to initialize form data. Start with one (e.g., highlights), then expand.

**Red Phase**: Write failing tests in `src/features/listing-creation/utils/initializers.test.ts`.
```ts
import { initializeHighlights, initializeFormDefaults } from './initializers';

describe('Form Initializers', () => {
  it('should initialize highlights with defaults', () => {
    const result = initializeHighlights();
    expect(result.category).toBe('Single Family');
    expect(result.petsAllowed).toBe(true);
  });

  it('should initialize highlights from draft data', () => {
    const draft = { category: 'Apartment', petsAllowed: false };
    const result = initializeHighlights(draft);
    expect(result.category).toBe('Apartment');
    expect(result.petsAllowed).toBe(false);
  });

  it('should provide full form defaults', () => {
    const defaults = initializeFormDefaults();
    expect(defaults.title).toBe('');
    expect(defaults.shortestLeaseLength).toBe(1);
  });
});
```

**Green Phase**: Create `src/features/listing-creation/utils/initializers.ts` with functions (migrate logic, e.g., `export function initializeHighlights(draft?: any) { return { category: draft?.category || 'Single Family', /* etc. */ }; }`). Add one function per test cycle. Refactor: Use object spreading for defaults.

**When Green**: Proceed to Step 4. (Initializers can now be used in state setup.)

---

### Step 4: Implement State Management with Zustand
**Goal**: Build a unified store for form state. Integrate initializers from Step 3.

**Red Phase**: Write failing tests in `src/features/listing-creation/store/listingStore.test.ts`.
```ts
import { useListingStore } from './listingStore'; // Hook usage in tests via renderHook

describe('Listing Store', () => {
  it('should initialize with default form data', () => {
    const { result } = renderHook(() => useListingStore());
    expect(result.current.formData.title).toBe(''); // From initializers
    expect(result.current.currentStep).toBe(0);
  });

  it('should update form data', () => {
    const { result } = renderHook(() => useListingStore());
    act(() => result.current.setFormData({ title: 'New Title' }));
    expect(result.current.formData.title).toBe('New Title');
  });

  it('should set validation errors for a step', () => {
    const { result } = renderHook(() => useListingStore());
    act(() => result.current.setErrors(0, ['Missing category']));
    expect(result.current.validationErrors[0]).toEqual(['Missing category']);
  });
});
```

**Green Phase**: Create `src/features/listing-creation/store/listingStore.ts` using Zustand (as in the previous response). Use initializers to set defaults. Refactor: Add immer for immutable updates if state grows complex.

**When Green**: Proceed to Step 5. (Store is ready; start integrating into the component in later steps.)

---

### Step 5: Add Validation Utilities Using Schemas
**Goal**: Create validation functions that use Zod schemas from Step 2. Integrate with store errors.

**Red Phase**: Write failing tests in `src/features/listing-creation/utils/validators.test.ts`.
```ts
import { validateHighlights, validateAllSteps } from './validators';
import { highlightsSchema } from '../schemas/listingSchemas';

describe('Validators', () => {
  it('should return errors for invalid highlights using schema', () => {
    const data = { category: '' };
    const errors = validateHighlights(data);
    expect(errors).toContain('Property type required');
  });

  it('should return empty array for valid data', () => {
    const data = { category: 'Apartment', petsAllowed: true, furnished: false };
    const errors = validateHighlights(data);
    expect(errors).toHaveLength(0);
  });

  it('should validate all steps and return errors map', () => {
    const formData = { highlights: { category: '' } /* incomplete */ };
    const errors = validateAllSteps(formData);
    expect(errors[0]).toContain('Property type required');
  });
});
```

**Green Phase**: Create `src/features/listing-creation/utils/validators.ts` (e.g., `export function validateHighlights(data: unknown) { const result = highlightsSchema.safeParse(data); return result.success ? [] : result.error.errors.map(e => e.message); }`). Build `validateAllSteps` by combining schemas. Refactor: Make it generic for any schema.

**When Green**: Proceed to Step 6.

---

### Step 6: Implement Services and Hooks with TanStack Query
**Goal**: Add data services for loading/saving drafts. Use hooks for integration.

**Red Phase**: Write failing tests in `src/features/listing-creation/services/listingService.test.ts`.
```ts
import { useLoadDraft, useSaveDraft } from './listingService';

describe('Listing Service', () => {
  it('should load draft data via query', async () => {
    const { result } = renderHook(() => useLoadDraft('123'));
    await waitFor(() => expect(result.current.data).toEqual({ id: '123', title: 'Draft' })); // Fails initially
  });

  it('should save draft via mutation and handle success', async () => {
    const { result } = renderHook(() => useSaveDraft());
    await act(async () => {
      await result.current.mutateAsync({ title: 'New' });
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
```

**Green Phase**: Create `src/features/listing-creation/services/listingService.ts` with TanStack Query hooks (as in previous response). Mock API calls initially, then integrate real ones. Refactor: Add error handling with toasts.

**When Green**: Proceed to Step 7.

---

### Step 7: Refactor the Client Component Incrementally
**Goal**: Rewrite `add-property-client.tsx` to use the new store, hooks, and validators. Do one section at a time (e.g., integrate state first, then navigation).

**Red Phase**: Write integration tests in `src/features/listing-creation/add-property-client.test.tsx`.
```ts
describe('AddPropertyClient', () => {
  it('should render initial step with store data', () => {
    render(<AddPropertyClient />);
    expect(screen.getByText('Which of these describes your place?')).toBeInTheDocument(); // UI title
  });

  it('should handle next step after validation', async () => {
    render(<AddPropertyClient />);
    // Simulate input and click next
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Where is your place located?')).toBeInTheDocument());
  });

  it('should save draft on button click', async () => {
    render(<AddPropertyClient />);
    fireEvent.click(screen.getByText('Save & Exit'));
    await waitFor(() => expect(mockSaveDraft).toHaveBeenCalled()); // Mock from service
  });
});
```

**Green Phase**: Update `add-property-client.tsx` section-by-section: First replace states with store, then add validation on next/back, finally integrate services. Keep existing render logic. Refactor: Extract sub-components (e.g., `<StepRenderer />`).

**When Green**: Proceed to Step 8 (full integration).

---

### Step 8: Full Integration and Final Polish
**Goal**: Wire everything into `page.tsx` and add error boundaries/logging. Test the end-to-end flow.

**Red Phase**: Add e2e-like tests for the full flow (e.g., simulate creating a listing).

**Green Phase**: Update `page.tsx` to use new services. Add ErrorBoundary wrappers. Refactor: Optimize with memoization.

**When Green**: The rewrite is complete. Run full regression tests on the app.

This plan ensures steady progress—aim for 1-2 steps per dev day. If tests fail unexpectedly, debug and refactor before moving on.

# Story: Create a Listing

## Description
A host can create a new property listing through a multi-step wizard that collects property details, location, rooms, amenities, photos, pricing, deposit info, and highlights.

## Acceptance Criteria
- [ ] Host can start listing creation at `/app/host/add-property`
- [ ] Wizard steps: basics, location, address confirmation, rooms, amenities, photos upload, photo selection, pricing, pricing confirmation, deposit, highlights, review
- [ ] Draft is saved between steps so host can resume later
- [ ] Photos can be uploaded and reordered
- [ ] Monthly pricing can be configured
- [ ] Final review step shows all info before publishing
- [ ] Success confirmation is shown after publishing

## Relevant Files
- `src/app/app/host/add-property/page.tsx`
- `src/app/app/host/add-property/add-property-client.tsx`
- `src/app/app/host/add-property/listing-creation-basics.tsx`
- `src/app/app/host/add-property/listing-creation-location-input.tsx`
- `src/app/app/host/add-property/listing-creation-address-confirmation.tsx`
- `src/app/app/host/add-property/listing-creation-rooms.tsx`
- `src/app/app/host/add-property/listing-creation-amenities.tsx`
- `src/app/app/host/add-property/listing-creation-photos-upload.tsx`
- `src/app/app/host/add-property/listing-creation-photo-selection.tsx`
- `src/app/app/host/add-property/listing-creation-pricing.tsx`
- `src/app/app/host/add-property/listing-creation-confirm-pricing.tsx`
- `src/app/app/host/add-property/listing-creation-deposit.tsx`
- `src/app/app/host/add-property/listing-creation-highlights.tsx`
- `src/app/app/host/add-property/listing-creation-review.tsx`
- `src/app/app/host/add-property/listing-creation-success.tsx`
- `src/app/actions/listings-in-creation.ts`
- `src/app/actions/listings.ts`

## Testing
- **Tested:** No
- **Test File:** N/A
- **Test Coverage Notes:**

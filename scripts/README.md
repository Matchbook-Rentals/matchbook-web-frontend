# Reservation Deposit to Rent Due At Booking Migration

This directory contains scripts to safely migrate from `reservationDeposit` to `rentDueAtBooking` fields in the database.

## Migration Process

### Step 1: Add the New Field
✅ **COMPLETED**: Added `rentDueAtBooking` field to both `Listing` and `ListingInCreation` models in the Prisma schema alongside the existing `reservationDeposit` field.

### Step 2: Run the Migration Script
```bash
npm run migrate:reservation-deposit
```

This script will:
- Copy all `reservationDeposit` values to `rentDueAtBooking` 
- Handle both `Listing` and `ListingInCreation` models
- Provide detailed logging of the migration process
- Only migrate records where `reservationDeposit` is not null and `rentDueAtBooking` is null

### Step 3: Verify the Migration
```bash
npm run verify:reservation-deposit
```

This script will:
- Check that all `reservationDeposit` values have been copied to `rentDueAtBooking`
- Verify that the values match exactly
- Report any mismatches or missing data
- Provide a summary of the migration status

### Step 4: Update Frontend Code
After the migration is complete and verified, update the frontend code to use `rentDueAtBooking` instead of `reservationDeposit`. The frontend changes need to be made in:

- Form components
- API endpoints
- Display components
- Type definitions

### Step 5: Run Cleanup (Optional)
```bash
npm run cleanup:reservation-deposit
```

**⚠️ WARNING**: This script will permanently remove all `reservationDeposit` values! Only run this after:
1. The migration is complete and verified
2. The frontend has been updated to use `rentDueAtBooking`
3. Testing confirms everything works correctly

This script will:
- Clear all `reservationDeposit` values (set to null)
- Provide safety checks to prevent accidental data loss
- Verify that all values have been cleared

### Step 6: Remove the Column (Future)
After the cleanup is complete and you're confident everything is working, you can remove the `reservationDeposit` field from the Prisma schema entirely.

## Script Files

- `migrate-reservation-deposit.js` - Copies values from `reservationDeposit` to `rentDueAtBooking`
- `verify-reservation-deposit-migration.js` - Verifies the migration was successful
- `cleanup-reservation-deposit.js` - Clears the old `reservationDeposit` values

## Safety Features

All scripts include:
- Dry-run capabilities for verification
- Detailed logging and progress reporting
- Error handling and rollback options
- Data validation checks
- User confirmation prompts for destructive operations

## Expected Output

The verification script will output something like:
```
✅ SUCCESS: Migration is complete and all values match!
   Ready to drop XXXX reservationDeposit values after frontend updates.
```

This indicates that XXXX records were successfully migrated and are ready for the frontend to be updated to use `rentDueAtBooking`.
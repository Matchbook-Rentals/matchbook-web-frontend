# Claude Jobs

## UI/UX Improvements

### Delete Unavailability Dialog Redundancy
**Date**: 2025-07-15  
**Status**: Identified  

There are two separate delete unavailability dialogs with nearly identical functionality:

1. **`schedule-viewer-popover-day.tsx`** - 400px max width, used in calendar day popovers
2. **`schedule-viewer-days.tsx`** - 550px max width, used in date range selector

Both dialogs:
- Display the same confirmation message
- Have identical Cancel/Delete button layout
- Call the same `onDeleteUnavailability` callback
- Show the same date range formatting

**Recommendation**: Consider consolidating these into a single reusable `DeleteUnavailabilityDialog` component to reduce code duplication and improve maintainability.

**Files to review**:
- `/src/components/ui/custom-calendar/schedule-viewer-popover-day.tsx` (lines 101-133)
- `/src/components/ui/custom-calendar/date-range-selector/schedule-viewer-days.tsx` (lines 248-280)
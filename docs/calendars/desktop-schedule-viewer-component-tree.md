# Desktop Schedule Viewer Component Tree Documentation

## Overview

The `desktop-schedule-viewer.tsx` component is the core calendar system for displaying host availability, bookings, and unavailable periods. It implements a complex tree of components that work together to provide an interactive scheduling interface.

## Component Tree Structure

```
DesktopScheduleViewer
├── Legend (MatchBook/Off-Platform/Unavailable indicators)
├── Desktop View (xl:flex - Two Calendar Layout)
│   ├── CalendarMonth (Left Calendar)
│   │   ├── Navigation Header
│   │   │   ├── Prev/Next Buttons
│   │   │   ├── Month Select (with Portal/Non-Portal modes)
│   │   │   └── Year Select (with Portal/Non-Portal modes)
│   │   ├── Day Headers (Su, Mo, Tu, We, Th, Fr, Sa)
│   │   ├── Calendar Grid (7x6 fixed layout)
│   │   │   ├── Empty Cells (for month start offset)
│   │   │   ├── CalendarDay Components (for each day)
│   │   │   │   ├── Day Display (with range styling)
│   │   │   │   ├── Popover (conditional - if displayInfo exists)
│   │   │   │   │   ├── PopoverTrigger (interactive button)
│   │   │   │   │   └── PopoverContent
│   │   │   │   │       ├── Booking Info (if isBooked)
│   │   │   │   │       │   ├── Guest details
│   │   │   │   │       │   ├── Date range
│   │   │   │   │       │   └── View Booking Button (BrandButton default)
│   │   │   │   │       └── Unavailability Info (if isUnavailable)
│   │   │   │   │           ├── Date range and reason
│   │   │   │   │           └── Action Buttons
│   │   │   │   │               ├── Delete Button (BrandButton destructive-outline)
│   │   │   │   │               └── Edit Button (BrandButton default)
│   │   │   │   ├── Tooltip (conditional - if asToolTip mode)
│   │   │   │   │   ├── TooltipTrigger (non-interactive div)
│   │   │   │   │   └── TooltipContent (simple display)
│   │   │   │   └── Range Visual Elements
│   │   │   │       ├── Background Range (full days in range)
│   │   │   │       ├── Start Range (half background, right side)
│   │   │   │       └── End Range (half background, left side)
│   │   │   └── Fill Cells (to complete 6x7 grid)
│   │   └── TooltipProvider (conditional wrapper when asToolTips=true)
│   └── CalendarMonth (Right Calendar) - Same structure as left
└── Mobile/Tablet View (xl:hidden - Single Calendar)
    └── CalendarMonth (Same structure as above)
```

## Component Flow and Interactions

### 1. **Data Flow Architecture**

```typescript
// Props flow down the tree:
DesktopScheduleViewer
  ├─ bookings: Booking[]
  ├─ unavailablePeriods: UnavailablePeriod[]
  └─ asToolTips?: boolean
    ↓
CalendarMonth
  ├─ year/month: number (calendar positioning)
  ├─ bookings/unavailablePeriods (filtered for display)
  ├─ navigation handlers
  └─ asToolTips (passed through)
    ↓
CalendarDay (for each calendar day)
  ├─ day: number
  ├─ booking/unavailability state (computed)
  ├─ range position (isStartOfRange, isEndOfRange, isInRange)
  ├─ visual styling props
  └─ asToolTip (individual day setting)
```

### 2. **State Management Flow**

```typescript
// State flows through these levels:

// DesktopScheduleViewer Level:
const [leftMonth, setLeftMonth] = useState(currentMonth)
const [leftYear, setLeftYear] = useState(currentYear)
const [rightMonth, setRightMonth] = useState(nextMonth)
const [rightYear, setRightYear] = useState(rightYear)

// CalendarMonth Level:
// - No local state, uses computed values
// - Handles month/year navigation
// - Manages select portal behavior

// CalendarDay Level:
const [isOpen, setIsOpen] = useState(false) // Popover state
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
```

### 3. **Conditional Rendering Logic**

```typescript
// CalendarDay rendering decision tree:
if (displayInfo) {
  if (asToolTip) {
    return <Tooltip>...</Tooltip>
  } else {
    return <Popover>...</Popover>
  }
} else {
  return <DayButton /> // Simple non-interactive day
}

// displayInfo is derived from:
displayInfo = getBookingInfo(day) || getUnavailableReason(day)
```

### 4. **Range Visualization System**

The calendar implements a sophisticated range visualization system:

```typescript
// Range Detection Logic:
const isStartOfRange = isStartOfBookingRange(day) || isStartOfUnavailableRange(day)
const isEndOfRange = isEndOfBookingRange(day) || isEndOfUnavailableRange(day)
const isInRange = isInBookingRange(day) || isInUnavailableRange(day)
const rangeType = getRangeType(day) // 'booking' | 'unavailable' | null

// Visual Range Elements:
showRangeBackground = isInRange && !isStartOfRange && !isEndOfRange
showStartBackground = isStartOfRange && !isEndOfRange
showEndBackground = isEndOfRange && !isStartOfRange
```

### 5. **Interactive vs Non-Interactive Modes**

The component supports two interaction modes:

#### **Popover Mode (default, asToolTips=false)**
- **Interactive Elements**: Clickable buttons, form controls
- **Full Features**: Edit/Delete/View actions available
- **Hover Effects**: Complex hover states with color changes
- **Accessibility**: Full keyboard navigation support

#### **Tooltip Mode (asToolTips=true)**
- **Non-Interactive**: Simple hover tooltips only
- **Limited Features**: Display information only
- **Minimal UI**: Simplified hover behavior
- **Performance**: Lighter weight for display-only contexts

## Dialog System Integration

### **Dialog Hierarchy**

```
CalendarDay Component
├── EditUnavailabilityDialog (BrandDialog)
│   ├── Date Range Inputs (with validation)
│   ├── Reason Textarea
│   ├── Change Detection State
│   └── Dynamic Buttons (Reset/Close + Save)
└── Delete Confirmation Dialog (BrandDialog)
    ├── Confirmation Message
    └── Cancel/Delete Buttons
```

### **Dialog State Management**

```typescript
// Each CalendarDay manages its own dialog states:
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

// EditUnavailabilityDialog internal state:
const [hasChanges, setHasChanges] = useState(false) // Change detection
const [originalValues] = useState({...}) // Reset reference
```

## Navigation and Synchronization

### **Dual Calendar Coordination**

```typescript
// Ensures calendars don't overlap and maintain logical sequence:
const handleLeftNextMonth = () => {
  // Update left calendar
  setLeftMonth(nextLeftMonth)
  
  // Prevent overlap with right calendar
  if (nextLeftMonth === rightMonth && nextLeftYear === rightYear) {
    // Push right calendar forward
    setRightMonth(rightMonth + 1)
  }
}
```

### **Month/Year Selection**

```typescript
// Portal vs Non-Portal rendering for Select components:
{useSelectPortal ? (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content position="popper">
      {/* Dropdown content */}
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
) : (
  <SelectPrimitive.Content position="item-aligned">
    {/* Dropdown content */}
  </SelectPrimitive.Content>
)}
```

## Performance Optimizations

### **Grid Layout Efficiency**

- **Fixed 6x7 Grid**: Always renders 42 cells for consistent layout
- **Fill Cells**: Empty cells complete the grid without content processing
- **Memoized Calculations**: Date computations cached per render cycle

### **Conditional Wrapping**

```typescript
// TooltipProvider only when needed:
return asToolTips ? (
  <TooltipProvider>{calendarContent}</TooltipProvider>
) : (
  calendarContent
)
```

### **Portal Management**

- **Configurable Portals**: Select dropdowns can use portal or inline rendering
- **Z-Index Management**: Proper layering for overlapping elements
- **Responsive Behavior**: Different portal strategies for different screen sizes

## Integration Points

### **External Dependencies**

- **@radix-ui/react-select**: Month/year selection dropdowns
- **@radix-ui/react-popover**: Day information popovers  
- **@radix-ui/react-tooltip**: Tooltip mode display
- **framer-motion**: Animation system (imported but usage minimal)
- **date-fns**: Date manipulation and formatting
- **class-variance-authority**: Dynamic className generation

### **Internal Dependencies**

- **BrandButton**: Consistent button styling across actions
- **BrandDialog**: Standardized dialog system
- **ScrollArea**: Dropdown content scrolling
- **cn utility**: Tailwind className merging

## Usage Examples

### **Basic Calendar Display**

```tsx
<DesktopScheduleViewer
  bookings={bookings}
  unavailablePeriods={unavailablePeriods}
/>
```

### **Non-Interactive Tooltip Mode**

```tsx
<DesktopScheduleViewer
  bookings={bookings}
  unavailablePeriods={unavailablePeriods}
  asToolTips={true} // Tooltip mode for display-only contexts
/>
```

### **Advanced Configuration**

```tsx
<CalendarMonth
  year={2024}
  month={5}
  bookings={bookings}
  unavailablePeriods={unavailablePeriods}
  onMonthChange={handleMonthChange}
  onYearChange={handleYearChange}
  useSelectPortal={false} // Disable portal rendering
  asToolTips={false} // Full interactive mode
  className="custom-calendar"
  dayClassName="custom-day"
/>
```

## Troubleshooting

### **Common Issues**

1. **Portal Rendering Problems**: Check `useSelectPortal` setting
2. **Calendar Sync Issues**: Verify month/year coordination logic
3. **Z-Index Conflicts**: Ensure proper portal/popover layering
4. **Date Range Visualization**: Check range detection functions
5. **Dialog State Conflicts**: Verify dialog state isolation per day

### **Debug Tools**

- **React DevTools**: Inspect component state and props
- **Date Logging**: Add console.logs to date computation functions
- **Range Detection**: Log range states to verify visual calculations
- **Dialog State**: Monitor dialog open/close states

## Future Considerations

### **Potential Enhancements**

- **Virtual Scrolling**: For very large date ranges
- **Keyboard Navigation**: Enhanced accessibility features
- **Custom Themes**: Dynamic color scheme support
- **Animation System**: Smooth transitions between months
- **Mobile Gestures**: Swipe navigation for touch devices
- **Accessibility**: ARIA labels and screen reader support
- **Performance**: Memoization for expensive date calculations

This component tree represents a sophisticated calendar system that balances functionality, performance, and user experience while maintaining flexibility for different use cases.
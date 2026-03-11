interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface GuestCounts {
  adults: number;
  children: number;
  pets: number;
}

const formatShortDate = (d: Date | null): string =>
  d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

export const formatDateDisplay = (dateRange: DateRange): string => {
  if (!dateRange.start && !dateRange.end) return '';
  if (dateRange.start && dateRange.end)
    return `${formatShortDate(dateRange.start)} – ${formatShortDate(dateRange.end)}`;
  if (dateRange.start) return `${formatShortDate(dateRange.start)} – ...`;
  return '';
};

export const formatGuestDisplay = (guests: GuestCounts): string => {
  const renters = guests.adults + guests.children;
  if (renters === 0 && guests.pets === 0) return '';
  const parts: string[] = [];
  if (renters > 0) parts.push(`${renters} Renter${renters !== 1 ? 's' : ''}`);
  if (guests.pets > 0) parts.push(`${guests.pets} Pet${guests.pets !== 1 ? 's' : ''}`);
  return parts.join(' and ');
};

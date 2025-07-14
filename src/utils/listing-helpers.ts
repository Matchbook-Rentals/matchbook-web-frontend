export function getListingDisplayName(listing: { streetAddress1?: string | null; title?: string | null }): string {
  return ((listing.streetAddress1 || listing.title || 'Listing') as string)
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
/**
 * Formats a ZAR amount given in cents to a display string.
 * e.g. 34900 → "R 349.00", 1234567 → "R 12 345.67"
 */
export function formatZAR(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

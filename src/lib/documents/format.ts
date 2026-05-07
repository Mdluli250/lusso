/**
 * Format cents to ZAR string for use in PDF documents.
 * Uses the same Intl.NumberFormat approach as the existing formatCurrency.ts.
 * e.g., 34900 → "R 349.00", 1250000 → "R 12 500.00"
 */
export function formatZARForDocument(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

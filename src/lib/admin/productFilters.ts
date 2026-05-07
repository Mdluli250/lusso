/**
 * Filter products by a case-insensitive search term matching name or scentProfile.
 */
export function filterProducts<T extends { name: string; scentProfile: string }>(
  products: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return products;

  const term = searchTerm.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.scentProfile.toLowerCase().includes(term)
  );
}

/**
 * Sort products by a given key in ascending or descending order.
 */
export function sortProducts<T extends Record<string, unknown>>(
  products: T[],
  key: keyof T & string,
  direction: 'asc' | 'desc'
): T[] {
  const sorted = [...products].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }

    if (aVal instanceof Date && bVal instanceof Date) {
      return aVal.getTime() - bVal.getTime();
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }

    // Fallback: compare as strings
    return String(aVal).localeCompare(String(bVal));
  });

  return direction === 'desc' ? sorted.reverse() : sorted;
}

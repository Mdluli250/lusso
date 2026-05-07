/**
 * Generate a URL-safe slug from a product name.
 * Lowercases, trims, removes special characters, replaces spaces with hyphens,
 * and strips leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

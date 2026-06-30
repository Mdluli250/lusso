import { prisma } from "@/lib/prisma";

/**
 * Fetch a single scalar content block by key.
 * Returns `fallback` if the row is absent, the stored value is an empty string,
 * or the database is unavailable.
 */
export async function getContent(
  key: string,
  fallback: string
): Promise<string> {
  try {
    const block = await prisma.contentBlock.findUnique({ where: { key } });
    if (!block || block.value === "") {
      return fallback;
    }
    return block.value;
  } catch (err) {
    console.warn(`[CMS] getContent failed for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Fetch a JSON-typed content block, parse it, and return as T.
 * Returns `fallback` on absence, DB error, or parse failure.
 */
export async function getContentJson<T>(
  key: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await getContent(key, "");
    if (raw === "") {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[CMS] getContentJson failed for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Fetch all content blocks for a given page section in a single query.
 * Returns a Map<key, string> where any missing or empty-string key falls back
 * to the corresponding value in `fallbacks`. On DB error, returns a map
 * populated entirely from `fallbacks`.
 */
export async function getContentSection(
  section: string,
  fallbacks: Record<string, string>
): Promise<Map<string, string>> {
  try {
    const blocks = await prisma.contentBlock.findMany({
      where: { key: { startsWith: section + "." } },
    });

    const map = new Map<string, string>(
      blocks
        .filter((b) => b.value !== "")
        .map((b) => [b.key, b.value])
    );

    // Merge fallbacks for any key that is missing or was empty in the DB
    for (const [fbKey, fbValue] of Object.entries(fallbacks)) {
      if (!map.has(fbKey)) {
        map.set(fbKey, fbValue);
      }
    }

    return map;
  } catch (err) {
    console.warn(
      `[CMS] getContentSection failed for section "${section}":`,
      err
    );
    // Return a fully-fallback map on DB error
    return new Map<string, string>(Object.entries(fallbacks));
  }
}

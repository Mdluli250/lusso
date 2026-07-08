import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────

export interface CollectionCardData {
  title: string;
  description: string;
  imageUrl: string;
  filterParam: string;
  displayOrder: number;
}

// ─── Validation ───────────────────────────────────────────────────

function isValidCard(card: unknown): card is CollectionCardData {
  if (typeof card !== "object" || card === null) return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.title === "string" &&
    c.title.length > 0 &&
    c.title.length <= 50 &&
    typeof c.description === "string" &&
    c.description.length <= 150 &&
    typeof c.imageUrl === "string" &&
    typeof c.filterParam === "string" &&
    c.filterParam.length > 0 &&
    typeof c.displayOrder === "number" &&
    Number.isInteger(c.displayOrder)
  );
}

// ─── Data Fetching Functions ──────────────────────────────────────

/**
 * Fetches admin-managed collection cards from the ContentBlock store.
 * Returns a sorted array of cards, or null if missing/invalid/error.
 */
export async function getAdminCollections(): Promise<CollectionCardData[] | null> {
  try {
    const block = await prisma.contentBlock.findUnique({
      where: { key: "collections.cards" },
    });

    if (!block) return null;

    const parsed = JSON.parse(block.value);

    if (!Array.isArray(parsed)) return null;
    if (parsed.length === 0) return null;

    const cards: CollectionCardData[] = [];
    for (const item of parsed) {
      if (!isValidCard(item)) return null;
      cards.push(item);
    }

    cards.sort((a, b) => a.displayOrder - b.displayOrder);

    return cards;
  } catch {
    return null;
  }
}

/**
 * Fetches the custom collections section heading from the ContentBlock store.
 * Returns the heading string, or null if missing/error.
 */
export async function getCollectionsHeading(): Promise<string | null> {
  try {
    const block = await prisma.contentBlock.findUnique({
      where: { key: "collections.heading" },
    });

    if (!block) return null;

    return block.value;
  } catch {
    return null;
  }
}

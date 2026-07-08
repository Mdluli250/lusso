"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────

export interface CollectionCard {
  title: string;
  description: string;
  imageUrl: string;
  filterParam: string;
  displayOrder: number;
}

export type SaveCollectionsResult = { success: true } | { error: string };

// ─── Auth Guard ───────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return {};
}

// ─── Validation ───────────────────────────────────────────────────

export function validateCollectionCards(cards: CollectionCard[]): string | null {
  if (cards.length === 0) {
    return "At least one collection is required";
  }
  if (cards.length > 6) {
    return "Maximum of 6 collections allowed";
  }
  for (const card of cards) {
    if (!card.title || card.title.trim().length === 0) {
      return "Title is required";
    }
    if (card.title.length > 50) {
      return "Title must be 50 characters or less";
    }
    if (card.description.length > 150) {
      return "Description must be 150 characters or less";
    }
    if (!card.filterParam || card.filterParam.trim().length === 0) {
      return "Filter parameter is required";
    }
  }
  return null;
}

// ─── Server Actions ───────────────────────────────────────────────

export async function saveCollections(
  cards: CollectionCard[],
): Promise<SaveCollectionsResult> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const validationError = validateCollectionCards(cards);
  if (validationError) return { error: validationError };

  const sortedCards = [...cards].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  try {
    await prisma.contentBlock.upsert({
      where: { key: "collections.cards" },
      create: {
        key: "collections.cards",
        type: "json",
        value: JSON.stringify(sortedCards),
      },
      update: {
        value: JSON.stringify(sortedCards),
      },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to save collections: ${message}` };
  }
}

export async function saveCollectionsHeading(
  heading: string,
): Promise<SaveCollectionsResult> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  if (heading.length > 60) {
    return { error: "Heading must be 60 characters or less" };
  }

  try {
    await prisma.contentBlock.upsert({
      where: { key: "collections.heading" },
      create: {
        key: "collections.heading",
        type: "text",
        value: heading,
      },
      update: {
        value: heading,
      },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to save collections: ${message}` };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type UpsertResult = { success: true } | { error: string };

async function requireAdmin(): Promise<{ error?: string }> {
  const { requireAdminSession } = await import('@/lib/admin/auth');
  const result = await requireAdminSession();
  if (!result.ok) return { error: result.error };
  return {};
}

function validateUpsertInput(value: string): { error: string } | null {
  if (value.trim().length === 0) {
    return { error: "Value cannot be empty" };
  }
  if (value.length > 50_000) {
    return { error: "Value is too long (max 50 000 characters)" };
  }
  return null;
}

function getSection(key: string): string {
  return key.includes(".") ? key.split(".")[0] : key;
}

const SECTION_ROUTES: Record<string, string[]> = {
  hero: ["/"],
  about_preview: ["/"],
  testimonials: ["/"],
  services: ["/"],
  why_lusso: ["/"],
  gallery_images: ["/"],
  footer: ["/"],
  business_info: ["/", "/contact"],
  about_page: ["/about"],
  experiences: ["/experiences"],
};

export async function upsertContentBlock(
  key: string,
  value: string,
): Promise<UpsertResult> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const validationError = validateUpsertInput(value);
  if (validationError) return validationError;

  try {
    await prisma.contentBlock.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    const section = getSection(key);
    const paths = SECTION_ROUTES[section] ?? ["/"];
    for (const path of paths) {
      revalidatePath(path);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to save content: ${message}` };
  }
}

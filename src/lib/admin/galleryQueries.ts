import { prisma } from "@/lib/prisma";
import { GalleryImageRecord } from "@/types/gallery";

/**
 * Fetch all active gallery images sorted by sortOrder ascending.
 * Used by the homepage Gallery component.
 */
export async function getActiveGalleryImages(): Promise<GalleryImageRecord[]> {
  const images = await prisma.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return images;
}

/**
 * Fetch all gallery images (active and inactive) sorted by sortOrder ascending.
 * Used by the admin gallery grid.
 */
export async function getAllGalleryImages(): Promise<GalleryImageRecord[]> {
  const images = await prisma.galleryImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return images;
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { UploadResult } from "@/types/gallery";

async function requireAdmin(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return {};
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_BATCH_SIZE = 10;

export async function uploadGalleryImages(
  formData: FormData
): Promise<UploadResult> {
  const auth = await requireAdmin();
  if (auth.error) {
    return { uploaded: [], errors: [{ filename: "batch", reason: auth.error }] };
  }

  const files = formData.getAll("files") as File[];

  // Validate batch size — reject entire submission if > 10 files
  if (files.length === 0) {
    return { uploaded: [], errors: [{ filename: "batch", reason: "No files provided" }] };
  }

  if (files.length > MAX_BATCH_SIZE) {
    return {
      uploaded: [],
      errors: [{ filename: "batch", reason: `Maximum of ${MAX_BATCH_SIZE} files per upload` }],
    };
  }

  // Separate files into valid and invalid based on size and type
  const validFiles: File[] = [];
  const errors: { filename: string; reason: string }[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push({
        filename: file.name,
        reason: "Invalid file type. Accepted formats: JPEG, PNG, WebP",
      });
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        filename: file.name,
        reason: "File exceeds the 4 MB maximum file size limit",
      });
      continue;
    }

    validFiles.push(file);
  }

  // If no valid files remain, return early with just the errors
  if (validFiles.length === 0) {
    return { uploaded: [], errors };
  }

  // Get the current max sortOrder among active records
  const maxSortOrderResult = await prisma.galleryImage.aggregate({
    _max: { sortOrder: true },
    where: { isActive: true },
  });
  const currentMaxSortOrder = maxSortOrderResult._max.sortOrder ?? 0;

  // Upload valid files and create records
  const uploaded: { id: string; blobUrl: string; filename: string }[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const position = i + 1;

    try {
      // Upload to Vercel Blob
      const blobPath = `gallery/${Date.now()}-${file.name}`;
      const blob = await put(blobPath, file, {
        access: "public",
        contentType: file.type,
      });

      // Derive alt text from filename (without extension), truncated to 150 chars
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const alt = nameWithoutExt.slice(0, 150);

      // Create GalleryImage record
      const record = await prisma.galleryImage.create({
        data: {
          blobUrl: blob.url,
          alt,
          width: 800, // Default dimensions — actual dimensions can be updated later
          height: 600,
          isActive: true,
          sortOrder: currentMaxSortOrder + position,
        },
      });

      uploaded.push({
        id: record.id,
        blobUrl: record.blobUrl,
        filename: file.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        filename: file.name,
        reason: `Upload failed: ${message}`,
      });
    }
  }

  // Revalidate homepage after successful operations
  if (uploaded.length > 0) {
    revalidatePath("/");
  }

  return { uploaded, errors };
}

export async function reorderGalleryImages(
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) {
    return { error: auth.error };
  }

  if (!orderedIds || orderedIds.length === 0) {
    return { error: "No image IDs provided" };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.galleryImage.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Reorder failed: ${message}` };
  }
}

export async function updateGalleryImage(
  id: string,
  data: { alt?: string; isActive?: boolean }
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) {
    return { error: auth.error };
  }

  // Validate alt text length if provided
  if (data.alt !== undefined) {
    const trimmedAlt = data.alt.trim();
    if (trimmedAlt.length < 10 || trimmedAlt.length > 150) {
      return { error: "Alt text must be between 10 and 150 characters" };
    }
  }

  try {
    const updateData: { alt?: string; isActive?: boolean } = {};

    if (data.alt !== undefined) {
      updateData.alt = data.alt.trim();
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    await prisma.galleryImage.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to update gallery image: ${message}` };
  }
}

export async function deleteGalleryImage(
  id: string
): Promise<{ success: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) {
    return { error: auth.error };
  }

  // Fetch the record to get the blobUrl before deletion
  const image = await prisma.galleryImage.findUnique({
    where: { id },
  });

  if (!image) {
    return { error: "Gallery image not found" };
  }

  // Delete the database record first
  try {
    await prisma.galleryImage.delete({
      where: { id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Failed to delete gallery image: ${message}` };
  }

  // Attempt to delete the blob (best-effort)
  try {
    await del(image.blobUrl);
  } catch (error) {
    // Log the orphaned blob URL for manual cleanup, but still return success
    console.error(
      `[Gallery] Orphaned blob - failed to delete blob at URL: ${image.blobUrl}. Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  revalidatePath("/");

  return { success: true };
}

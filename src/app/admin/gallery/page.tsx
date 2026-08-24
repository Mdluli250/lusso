import { getAllGalleryImages } from "@/lib/admin/galleryQueries";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryUploadZone } from "./GalleryUploadZone";

/**
 * Admin Gallery Management page — async Server Component.
 *
 * Fetches all gallery images (active + inactive) from the database
 * and renders the GalleryGrid client component for CRUD + reorder.
 *
 * Auth protection is handled by the admin layout at src/app/admin/layout.tsx.
 *
 * Requirements: 5.1, 6.1
 */
export default async function AdminGalleryPage() {
  const images = await getAllGalleryImages();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Gallery Management
        </h1>
        <p className="text-sm text-muted mt-1">
          Upload, edit, reorder, and manage homepage gallery images. Changes are
          reflected on the live site immediately.
        </p>
      </div>

      <GalleryUploadZone />

      <GalleryGrid images={images} />
    </div>
  );
}

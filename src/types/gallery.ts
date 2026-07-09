/**
 * Gallery image types for the admin gallery management feature.
 */

/** Result of a batch gallery image upload operation. */
export interface UploadResult {
  uploaded: { id: string; blobUrl: string; filename: string }[];
  errors: { filename: string; reason: string }[];
}

/** Represents a gallery image record from the database. */
export interface GalleryImageRecord {
  id: string;
  blobUrl: string;
  alt: string;
  width: number;
  height: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

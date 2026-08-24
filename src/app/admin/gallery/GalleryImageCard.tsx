"use client";

import type { GalleryImageRecord } from "@/types/gallery";

interface GalleryImageCardProps {
  image: GalleryImageRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * GalleryImageCard — displays an individual gallery image with edit/delete controls.
 *
 * Features:
 * - Image thumbnail with alt text shown below
 * - Edit button (pencil icon) to open edit modal for alt text and active toggle
 * - Delete button (trash icon) to trigger confirmation prompt
 * - Visual indicator (semi-transparent overlay) for inactive images
 * - data-id attribute for drag-and-drop reorder support
 *
 * Requirements: 3.1, 3.2, 4.2
 */
export function GalleryImageCard({ image, onEdit, onDelete }: GalleryImageCardProps) {
  return (
    <div
      data-id={image.id}
      className="group relative rounded-lg border border-border bg-surface overflow-hidden"
    >
      {/* Image thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.blobUrl}
          alt={image.alt}
          className="object-cover w-full h-full"
        />

        {/* Inactive overlay */}
        {!image.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
              Inactive
            </span>
          </div>
        )}

        {/* Action buttons — always visible */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => onEdit(image.id)}
            className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label={`Edit ${image.alt}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            className="p-1.5 rounded bg-black/60 text-white hover:bg-red-600 transition-colors"
            aria-label={`Delete ${image.alt}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Alt text below image */}
      <div className="px-2 py-1.5">
        <p className="text-xs text-muted truncate" title={image.alt}>
          {image.alt}
        </p>
      </div>
    </div>
  );
}
